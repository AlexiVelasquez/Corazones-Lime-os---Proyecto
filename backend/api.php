<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

session_name('corazones_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Content-Security-Policy: default-src \'none\'; frame-ancestors \'none\'');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://127.0.0.1:8080', 'http://localhost:8080', 'http://localhost:4200', 'http://127.0.0.1:4200'];
$originParts = $origin !== '' ? parse_url($origin) : false;
$requestHost = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'), PHP_URL_HOST);
$sameHostOrigin = is_array($originParts)
    && in_array($originParts['scheme'] ?? '', ['http', 'https'], true)
    && in_array((int) ($originParts['port'] ?? 0), [4200, 8080], true)
    && strtolower((string) ($originParts['host'] ?? '')) === strtolower((string) $requestHost);
$originAllowed = $origin === '' || in_array($origin, $allowedOrigins, true) || $sameHostOrigin;
if ($origin !== '' && $originAllowed) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (!$originAllowed) {
        http_response_code(403);
        exit;
    }
    http_response_code(204);
    exit;
}

if (!$originAllowed) {
    http_response_code(403);
    echo json_encode(['error' => 'Origen no autorizado.']);
    exit;
}

function respond(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array
{
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 1048576) {
        respond(['error' => 'La solicitud supera el límite permitido.'], 413);
    }
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (!str_starts_with($contentType, 'application/json')) {
        respond(['error' => 'El contenido debe enviarse como JSON.'], 415);
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        respond(['error' => 'El cuerpo JSON no es válido.'], 400);
    }
    return $data;
}

function csrf_token(): string
{
    if (!isset($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function require_csrf(): void
{
    $provided = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($provided === '' || !hash_equals(csrf_token(), $provided)) {
        respond(['error' => 'La solicitud de seguridad expiró. Recarga la página e inténtalo otra vez.', 'code' => 'CSRF_INVALID'], 403);
    }
}

function rate_limit(string $bucket, int $maximum, int $windowSeconds): void
{
    $now = time();
    $attempts = array_values(array_filter(
        $_SESSION['rate_limits'][$bucket] ?? [],
        static fn(mixed $timestamp): bool => is_int($timestamp) && $timestamp > $now - $windowSeconds
    ));
    if (count($attempts) >= $maximum) {
        header('Retry-After: ' . $windowSeconds);
        respond(['error' => 'Demasiados intentos. Espera unos minutos antes de volver a intentar.'], 429);
    }
    $attempts[] = $now;
    $_SESSION['rate_limits'][$bucket] = $attempts;
}

function clear_rate_limit(string $bucket): void
{
    unset($_SESSION['rate_limits'][$bucket]);
}

function text_value(mixed $value, string $label, int $minimum, int $maximum): string
{
    $text = trim((string) $value);
    $length = mb_strlen($text);
    if ($length < $minimum || $length > $maximum) {
        respond(['error' => "{$label} debe contener entre {$minimum} y {$maximum} caracteres."], 422);
    }
    return $text;
}

function password_is_valid(string $password, string $stored): bool
{
    return str_starts_with($stored, '$')
        ? password_verify($password, $stored)
        : hash_equals($stored, hash('sha256', $password));
}

function supports_modern_passwords(PDO $db): bool
{
    static $supported = null;
    if (is_bool($supported)) return $supported;
    $column = $db->query("SHOW COLUMNS FROM usuarios LIKE 'clave_hash'")->fetch();
    preg_match('/\\((\\d+)\\)/', (string) ($column['Type'] ?? ''), $matches);
    return $supported = ((int) ($matches[1] ?? 0) >= 200);
}

function password_for_storage(PDO $db, string $password): string
{
    return supports_modern_passwords($db) ? password_hash($password, PASSWORD_DEFAULT) : hash('sha256', $password);
}

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (!array_key_exists($field, $data) || $data[$field] === '') {
            respond(['error' => "Falta el campo obligatorio: {$field}."], 422);
        }
    }
}

function account_row(array $row): array
{
    return [
        'id' => $row['id'],
        'role' => $row['rol'],
        'name' => $row['nombres'],
        'surname' => $row['apellidos'],
        'email' => $row['correo'],
        'phone' => $row['telefono'],
        'district' => $row['distrito'],
        'password' => '',
        'photo' => $row['foto'],
        'notifications' => [
            (bool) $row['notificar_impacto'],
            (bool) $row['notificar_campanas'],
            (bool) $row['notificar_resumen'],
        ],
    ];
}

function category_id(PDO $db, string $name): int
{
    $statement = $db->prepare('SELECT id FROM categorias_articulo WHERE nombre = :nombre AND activo = 1');
    $statement->execute(['nombre' => trim($name)]);
    $id = $statement->fetchColumn();
    if ($id === false) {
        respond(['error' => 'La categoría seleccionada no existe.'], 422);
    }
    return (int) $id;
}

function district_id(PDO $db, string $name): ?int
{
    $statement = $db->prepare('SELECT id FROM distritos WHERE nombre = :nombre AND activo = 1');
    $statement->execute(['nombre' => trim($name)]);
    $id = $statement->fetchColumn();
    return $id === false ? null : (int) $id;
}

function current_user(PDO $db): ?array
{
    $lastActivity = $_SESSION['last_activity'] ?? null;
    if (is_int($lastActivity) && $lastActivity < time() - 1800) {
        $_SESSION = [];
        session_regenerate_id(true);
        return null;
    }
    $userId = $_SESSION['user_id'] ?? null;
    if (!is_string($userId) || $userId === '') return null;
    $_SESSION['last_activity'] = time();
    $lastRotation = (int) ($_SESSION['last_rotation'] ?? 0);
    if ($lastRotation < time() - 600) {
        session_regenerate_id(true);
        $_SESSION['last_rotation'] = time();
    }
    $statement = $db->prepare(
        'SELECT u.id, r.codigo AS rol, u.nombres, u.apellidos, u.correo, u.telefono,
                COALESCE(di.nombre, "") AS distrito, u.foto,
                u.notificar_impacto, u.notificar_campanas, u.notificar_resumen
         FROM usuarios u
         INNER JOIN roles r ON r.id = u.rol_id
         LEFT JOIN distritos di ON di.id = u.distrito_id
         WHERE u.id = :id AND u.activo = 1'
    );
    $statement->execute(['id' => $userId]);
    return $statement->fetch() ?: null;
}

function require_role(PDO $db, array $roles): array
{
    $user = current_user($db);
    if (!$user) respond(['error' => 'Debes iniciar sesión para realizar esta acción.'], 401);
    if (!in_array($user['rol'], $roles, true)) respond(['error' => 'Tu rol no tiene permiso para realizar esta acción.'], 403);
    return $user;
}

function bootstrap(PDO $db): array
{
    $sessionUser = current_user($db);
    $accounts = $sessionUser ? [account_row($sessionUser)] : [];

    $shelters = array_map(static fn(array $row): array => [
        'id' => $row['id'],
        'name' => $row['nombre'],
        'district' => $row['distrito'],
        'status' => $row['estado'],
        'address' => $row['direccion'],
        'description' => $row['descripcion'],
        'image' => $row['imagen'],
        'latitude' => $row['latitud'] !== null ? (float) $row['latitud'] : null,
        'longitude' => $row['longitud'] !== null ? (float) $row['longitud'] : null,
    ], $db->query(
        'SELECT a.id, a.nombre, di.nombre AS distrito, a.estado, a.direccion,
                a.descripcion, a.imagen, a.latitud, a.longitud
         FROM albergues a INNER JOIN distritos di ON di.id = a.distrito_id
         ORDER BY a.creado_en'
    )->fetchAll());

    $collectionPoints = array_map(static fn(array $row): array => [
        'id' => 'PR-' . $row['id'],
        'title' => $row['nombre'],
        'district' => $row['distrito'],
        'address' => $row['direccion'],
        'reference' => $row['referencia'],
        'schedule' => $row['horario'],
        'latitude' => (float) $row['latitud'],
        'longitude' => (float) $row['longitud'],
        'label' => match ((int) $row['id']) {
            1 => 'Miraflores — Sede Central',
            2 => 'San Isidro — Centro Comunitario',
            3 => 'Santiago de Surco — Punto Aliado',
            4 => 'Lima Cercado — Punto Aliado',
            default => $row['distrito'] . ' — ' . $row['nombre'],
        },
    ], $db->query(
        'SELECT p.id, p.nombre, p.direccion, p.referencia, p.horario,
                p.latitud, p.longitud, di.nombre AS distrito
         FROM puntos_recojo p INNER JOIN distritos di ON di.id = p.distrito_id
         WHERE p.activo = 1 ORDER BY p.nombre'
    )->fetchAll());

    $donationRows = [];
    if ($sessionUser) {
        $filter = match ($sessionUser['rol']) {
            'donante' => ' WHERE d.donante_id = :usuario',
            'albergue' => ' WHERE d.albergue_id = :usuario',
            'admin' => '',
            default => ' WHERE 1 = 0',
        };
        $statement = $db->prepare(
            'SELECT d.*, u.nombres, u.apellidos, dd.descripcion, dd.cantidad,
                    dd.estado_articulos, ca.nombre AS categoria
             FROM donaciones d
             INNER JOIN usuarios u ON u.id = d.donante_id
             INNER JOIN detalle_donacion dd ON dd.id = (
                 SELECT MIN(dd2.id) FROM detalle_donacion dd2 WHERE dd2.donacion_id = d.id
             )
             INNER JOIN categorias_articulo ca ON ca.id = dd.categoria_id' . $filter .
            ' ORDER BY d.creado_en DESC'
        );
        $statement->execute($filter === '' ? [] : ['usuario' => $sessionUser['id']]);
        $donationRows = $statement->fetchAll();
    }
    $donations = array_map(static fn(array $row): array => [
        'id' => $row['id'],
        'donor' => $row['donante_id'],
        'donorName' => trim($row['nombres'] . ' ' . $row['apellidos']),
        'shelter' => $row['albergue_id'],
        'category' => $row['categoria'],
        'description' => $row['descripcion'],
        'quantity' => (int) $row['cantidad'],
        'condition' => $row['estado_articulos'],
        'method' => $row['metodo_entrega'],
        'district' => $row['ubicacion_entrega'],
        'address' => $row['direccion'],
        'reference' => $row['referencia'],
        'time' => $row['horario_preferido'],
        'date' => $row['fecha_programada'],
        'status' => $row['estado'],
    ], $donationRows);

    $needs = array_map(static fn(array $row): array => [
        'id' => 'N' . $row['id'],
        'shelter' => $row['albergue_id'],
        'description' => $row['descripcion'],
        'category' => $row['categoria'],
        'active' => (bool) $row['activa'],
    ], $db->query(
        'SELECT n.id, n.albergue_id, n.descripcion, ca.nombre AS categoria, n.activa
         FROM necesidades n
         INNER JOIN categorias_articulo ca ON ca.id = n.categoria_id
         ORDER BY n.creado_en DESC'
    )->fetchAll());

    return [...compact('accounts', 'shelters', 'collectionPoints', 'donations', 'needs'), 'csrfToken' => csrf_token()];
}

try {
    $db = database();
    $action = $_GET['action'] ?? 'health';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $getActions = ['health', 'bootstrap'];
    $postActions = ['login', 'logout', 'register', 'createDonation', 'createNeed', 'updateNeed', 'updateDonationStatus', 'updateShelterStatus', 'saveMessage', 'updateProfile', 'changePassword'];

    if ((!in_array($action, $getActions, true) && !in_array($action, $postActions, true))) {
        respond(['error' => 'Acción no encontrada.'], 404);
    }
    if ((in_array($action, $getActions, true) && $method !== 'GET') || (in_array($action, $postActions, true) && $method !== 'POST')) {
        header('Allow: ' . (in_array($action, $getActions, true) ? 'GET' : 'POST'));
        respond(['error' => 'Método HTTP no permitido para esta acción.'], 405);
    }

    if ($action === 'health') {
        $db->query('SELECT 1');
        respond(['ok' => true, 'database' => 'corazones_limenos']);
    }

    if ($action === 'bootstrap') {
        respond(bootstrap($db));
    }

    $data = body();
    require_csrf();

    if ($action === 'login') {
        rate_limit('login', 8, 600);
        require_fields($data, ['email', 'password']);
        $email = strtolower(trim((string) $data['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 160 || strlen((string) $data['password']) > 128) {
            respond(['error' => 'Correo o contraseña incorrectos.'], 401);
        }
        $statement = $db->prepare(
            'SELECT u.id, r.codigo AS rol, u.nombres, u.apellidos, u.correo, u.telefono,
                    COALESCE(di.nombre, "") AS distrito, u.foto,
                    u.notificar_impacto, u.notificar_campanas, u.notificar_resumen, u.clave_hash
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             LEFT JOIN distritos di ON di.id = u.distrito_id
             WHERE u.correo = :correo AND u.activo = 1'
        );
        $statement->execute(['correo' => $email]);
        $account = $statement->fetch();
        if (!$account || !password_is_valid((string) $data['password'], (string) $account['clave_hash'])) {
            respond(['error' => 'Correo o contraseña incorrectos.'], 401);
        }
        if (supports_modern_passwords($db) && !str_starts_with((string) $account['clave_hash'], '$')) {
            $rehash = $db->prepare('UPDATE usuarios SET clave_hash = :hash WHERE id = :id');
            $rehash->execute(['hash' => password_for_storage($db, (string) $data['password']), 'id' => $account['id']]);
        }
        session_regenerate_id(true);
        $_SESSION['user_id'] = $account['id'];
        $_SESSION['last_activity'] = time();
        $_SESSION['last_rotation'] = time();
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        clear_rate_limit('login');
        $lastAccess = $db->prepare('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = :id');
        $lastAccess->execute(['id' => $account['id']]);
        respond(['account' => account_row($account), 'csrfToken' => csrf_token()]);
    }

    if ($action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], '', (bool) $params['secure'], (bool) $params['httponly']);
        }
        session_destroy();
        respond(['ok' => true]);
    }

    if ($action === 'register') {
        rate_limit('register', 4, 600);
        if (current_user($db)) respond(['error' => 'Cierra la sesión actual antes de crear otra cuenta.'], 409);
        require_fields($data, ['role', 'name', 'surname', 'email', 'phone', 'district', 'password', 'repeatPassword']);
        $role = (string) $data['role'];
        if (!in_array($role, ['donante', 'albergue'], true)) {
            respond(['error' => 'Solo se pueden registrar cuentas de donante o albergue.'], 422);
        }
        $name = trim((string) $data['name']);
        $surname = trim((string) $data['surname']);
        $email = strtolower(trim((string) $data['email']));
        $phone = trim((string) $data['phone']);
        $password = (string) $data['password'];
        if (mb_strlen($name) < 2 || mb_strlen($name) > 100 || mb_strlen($surname) < 2 || mb_strlen($surname) > 100) respond(['error' => 'Ingresa nombres y apellidos válidos.'], 422);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['error' => 'Ingresa un correo electrónico válido.'], 422);
        if (!preg_match('/^\+?[\d\s]{9,15}$/', $phone)) respond(['error' => 'Ingresa un teléfono válido.'], 422);
        if (strlen($password) < 8 || !preg_match('/[a-z]/', $password) || !preg_match('/[A-Z]/', $password) || !preg_match('/\d/', $password)) {
            respond(['error' => 'La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.'], 422);
        }
        if ($password !== (string) $data['repeatPassword']) respond(['error' => 'Las contraseñas no coinciden.'], 422);
        if (!filter_var($data['acceptTerms'] ?? false, FILTER_VALIDATE_BOOLEAN)) respond(['error' => 'Debes aceptar los términos y la política de privacidad.'], 422);
        $districtId = district_id($db, (string) $data['district']);
        if ($districtId === null) respond(['error' => 'El distrito seleccionado no existe.'], 422);

        $shelterName = trim((string) ($data['shelterName'] ?? ''));
        $ruc = trim((string) ($data['ruc'] ?? ''));
        $address = trim((string) ($data['address'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        if ($role === 'albergue') {
            if (mb_strlen($shelterName) < 3 || mb_strlen($shelterName) > 160) respond(['error' => 'Ingresa un nombre de albergue válido.'], 422);
            if (!preg_match('/^\d{11}$/', $ruc)) respond(['error' => 'El RUC debe contener 11 dígitos.'], 422);
            if (mb_strlen($address) < 8 || mb_strlen($address) > 220 || mb_strlen($description) < 20 || mb_strlen($description) > 500) respond(['error' => 'Completa la dirección y descripción del albergue.'], 422);
        }

        $roleStatement = $db->prepare('SELECT id FROM roles WHERE codigo = :codigo');
        $roleStatement->execute(['codigo' => $role]);
        $roleId = $roleStatement->fetchColumn();
        if ($roleId === false) respond(['error' => 'El rol solicitado no está configurado.'], 500);
        $id = ($role === 'albergue' ? 'alb_' : 'don_') . bin2hex(random_bytes(6));

        $db->beginTransaction();
        $userStatement = $db->prepare(
            'INSERT INTO usuarios
             (id, rol_id, distrito_id, nombres, apellidos, correo, telefono, clave_hash)
             VALUES (:id, :rol, :distrito, :nombres, :apellidos, :correo, :telefono, :clave)'
        );
        $userStatement->execute([
            'id' => $id, 'rol' => $roleId, 'distrito' => $districtId,
            'nombres' => $name, 'apellidos' => $surname, 'correo' => $email,
            'telefono' => $phone, 'clave' => password_for_storage($db, $password),
        ]);
        $shelter = null;
        if ($role === 'albergue') {
            $shelterStatement = $db->prepare(
                'INSERT INTO albergues
                 (id, usuario_id, distrito_id, nombre, ruc, descripcion, direccion, estado)
                 VALUES (:id, :usuario, :distrito, :nombre, :ruc, :descripcion, :direccion, "Pendiente")'
            );
            $shelterStatement->execute([
                'id' => $id, 'usuario' => $id, 'distrito' => $districtId,
                'nombre' => $shelterName, 'ruc' => $ruc,
                'descripcion' => $description, 'direccion' => $address,
            ]);
            $shelter = ['id' => $id, 'name' => $shelterName, 'district' => (string) $data['district'], 'status' => 'Pendiente'];
        }
        $db->commit();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $id;
        $_SESSION['last_activity'] = time();
        $_SESSION['last_rotation'] = time();
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $account = current_user($db);
        respond(['account' => account_row($account), 'shelter' => $shelter, 'csrfToken' => csrf_token()], 201);
    }

    if ($action === 'createDonation') {
        $actor = require_role($db, ['donante']);
        require_fields($data, ['id', 'donor', 'shelter', 'category', 'description', 'quantity', 'method', 'date']);
        if ($data['donor'] !== $actor['id']) respond(['error' => 'No puedes registrar donaciones para otra cuenta.'], 403);
        $quantity = filter_var($data['quantity'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 1000]]);
        $description = text_value($data['description'], 'La descripción', 5, 300);
        if ($quantity === false) respond(['error' => 'Revisa la descripción y cantidad de la donación.'], 422);
        if (!in_array($data['method'], ['dropoff', 'pickup'], true)) respond(['error' => 'Método de entrega no permitido.'], 422);
        if (!in_array($data['condition'] ?? 'nuevo', ['nuevo', 'como nuevo', 'usado'], true)) respond(['error' => 'Estado de artículos no permitido.'], 422);
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', (string) $data['date']);
        if (!$date || $date->format('Y-m-d') !== $data['date']) respond(['error' => 'La fecha programada no es válida.'], 422);
        $shelterCheck = $db->prepare('SELECT COUNT(*) FROM albergues WHERE id = :id AND estado = "Aprobado"');
        $shelterCheck->execute(['id' => $data['shelter']]);
        if ((int) $shelterCheck->fetchColumn() !== 1) respond(['error' => 'Selecciona un albergue aprobado.'], 422);
        $categoryId = category_id($db, (string) $data['category']);
        $db->beginTransaction();
        $statement = $db->prepare(
            'INSERT INTO donaciones
             (id, donante_id, albergue_id, metodo_entrega, ubicacion_entrega,
              direccion, referencia, horario_preferido, fecha_programada, estado)
             VALUES
             (:id, :donante, :albergue, :metodo, :ubicacion,
              :direccion, :referencia, :horario, :fecha, :estado)'
        );
        $statement->execute([
            'id' => $data['id'], 'donante' => $data['donor'], 'albergue' => $data['shelter'],
            'metodo' => $data['method'], 'ubicacion' => $data['district'] ?? '',
            'direccion' => mb_substr(trim((string) ($data['address'] ?? '')), 0, 220),
            'referencia' => mb_substr(trim((string) ($data['reference'] ?? '')), 0, 220),
            'horario' => mb_substr(trim((string) ($data['time'] ?? '')), 0, 100), 'fecha' => $data['date'],
            'estado' => 'Pendiente',
        ]);
        $detail = $db->prepare(
            'INSERT INTO detalle_donacion
             (donacion_id, categoria_id, descripcion, cantidad, estado_articulos)
             VALUES (:donacion, :categoria, :descripcion, :cantidad, :condicion)'
        );
        $detail->execute([
            'donacion' => $data['id'], 'categoria' => $categoryId,
            'descripcion' => $description, 'cantidad' => $quantity,
            'condicion' => $data['condition'] ?? 'nuevo',
        ]);
        $tracking = $db->prepare(
            'INSERT INTO seguimiento_donacion (donacion_id, estado, comentario, registrado_por)
             VALUES (:donacion, :estado, :comentario, :usuario)'
        );
        $tracking->execute([
            'donacion' => $data['id'], 'estado' => 'Pendiente',
            'comentario' => 'Donación registrada desde la plataforma.', 'usuario' => $data['donor'],
        ]);
        $db->commit();
        respond(['ok' => true], 201);
    }

    if ($action === 'createNeed') {
        $actor = require_role($db, ['albergue']);
        require_fields($data, ['shelter', 'description', 'category']);
        if ($data['shelter'] !== $actor['id']) respond(['error' => 'No puedes publicar necesidades para otro albergue.'], 403);
        $description = text_value($data['description'], 'La necesidad', 5, 300);
        $approval = $db->prepare('SELECT estado FROM albergues WHERE id = :id');
        $approval->execute(['id' => $actor['id']]);
        if ($approval->fetchColumn() !== 'Aprobado') respond(['error' => 'El albergue debe estar aprobado antes de publicar necesidades.'], 403);
        $categoryId = category_id($db, (string) $data['category']);
        $statement = $db->prepare(
            'INSERT INTO necesidades (albergue_id, categoria_id, descripcion, activa)
             VALUES (:albergue, :categoria, :descripcion, 1)'
        );
        $statement->execute([
            'albergue' => $data['shelter'], 'descripcion' => $description,
            'categoria' => $categoryId,
        ]);
        respond(['ok' => true, 'id' => 'N' . $db->lastInsertId()], 201);
    }

    if ($action === 'updateNeed') {
        $actor = require_role($db, ['albergue']);
        require_fields($data, ['id', 'active']);
        $statement = $db->prepare('UPDATE necesidades SET activa = :activa WHERE id = :id AND albergue_id = :albergue');
        $statement->execute(['activa' => (int) (bool) $data['active'], 'id' => ltrim((string) $data['id'], 'N'), 'albergue' => $actor['id']]);
        if ($statement->rowCount() !== 1) respond(['error' => 'La necesidad no pertenece a tu albergue.'], 404);
        respond(['ok' => true]);
    }

    if ($action === 'updateDonationStatus') {
        $actor = require_role($db, ['admin', 'albergue']);
        require_fields($data, ['id', 'status']);
        $lookup = $db->prepare('SELECT albergue_id, estado FROM donaciones WHERE id = :id');
        $lookup->execute(['id' => $data['id']]);
        $donation = $lookup->fetch();
        if (!$donation) respond(['error' => 'La donación no existe.'], 404);
        $allowed = ($actor['rol'] === 'admin' && $donation['estado'] === 'Pendiente' && $data['status'] === 'En tránsito')
            || ($actor['rol'] === 'albergue' && $donation['albergue_id'] === $actor['id'] && $donation['estado'] === 'En tránsito' && $data['status'] === 'Entregado');
        if (!$allowed) respond(['error' => 'La transición solicitada no está permitida para tu rol.'], 403);
        $db->beginTransaction();
        $statement = $db->prepare('UPDATE donaciones SET estado = :estado WHERE id = :id');
        $statement->execute(['estado' => $data['status'], 'id' => $data['id']]);
        $tracking = $db->prepare(
            'INSERT INTO seguimiento_donacion (donacion_id, estado, comentario)
             VALUES (:donacion, :estado, :comentario)'
        );
        $tracking->execute([
            'donacion' => $data['id'], 'estado' => $data['status'],
            'comentario' => 'Estado actualizado por el rol ' . $actor['rol'] . '.',
        ]);
        $db->commit();
        respond(['ok' => true]);
    }

    if ($action === 'updateShelterStatus') {
        require_role($db, ['admin']);
        require_fields($data, ['id', 'status']);
        if (!in_array($data['status'], ['Aprobado', 'Rechazado'], true)) respond(['error' => 'Estado de albergue no permitido.'], 422);
        $statement = $db->prepare('UPDATE albergues SET estado = :estado WHERE id = :id');
        $statement->execute(['estado' => $data['status'], 'id' => $data['id']]);
        respond(['ok' => true]);
    }

    if ($action === 'saveMessage') {
        rate_limit('contact', 10, 600);
        require_fields($data, ['name', 'email', 'subject', 'message']);
        $name = text_value($data['name'], 'El nombre', 2, 120);
        $subject = text_value($data['subject'], 'El asunto', 3, 160);
        $message = text_value($data['message'], 'El mensaje', 10, 2000);
        $email = strtolower(trim((string) $data['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['error' => 'Ingresa un correo válido.'], 422);
        $statement = $db->prepare(
            'INSERT INTO mensajes_contacto (nombre, correo, asunto, mensaje)
             VALUES (:nombre, :correo, :asunto, :mensaje)'
        );
        $statement->execute([
            'nombre' => $name, 'correo' => $email,
            'asunto' => $subject, 'mensaje' => $message,
        ]);
        respond(['ok' => true], 201);
    }

    if ($action === 'updateProfile') {
        $actor = require_role($db, ['donante', 'albergue', 'admin']);
        require_fields($data, ['id', 'name', 'email', 'phone', 'district']);
        if ($data['id'] !== $actor['id']) respond(['error' => 'No puedes modificar otro perfil.'], 403);
        $notifications = $data['notifications'] ?? [true, true, false];
        $name = text_value($data['name'], 'El nombre', 2, 100);
        $surname = trim((string) ($data['surname'] ?? ''));
        if (mb_strlen($surname) > 100) respond(['error' => 'Los apellidos superan el límite permitido.'], 422);
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) respond(['error' => 'Ingresa un correo válido.'], 422);
        if (!preg_match('/^\+?[\d\s]{9,15}$/', (string) $data['phone'])) respond(['error' => 'Ingresa un teléfono válido.'], 422);
        $districtId = district_id($db, (string) $data['district']);
        if ($districtId === null) {
            respond(['error' => 'El distrito seleccionado no existe.'], 422);
        }
        $statement = $db->prepare(
            'UPDATE usuarios SET nombres = :nombres, apellidos = :apellidos, correo = :correo,
             telefono = :telefono, distrito_id = :distrito, foto = :foto,
             notificar_impacto = :impacto, notificar_campanas = :campanas,
             notificar_resumen = :resumen WHERE id = :id'
        );
        $statement->execute([
            'id' => $data['id'], 'nombres' => $name, 'apellidos' => $surname,
            'correo' => strtolower(trim((string) $data['email'])), 'telefono' => $data['phone'],
            'distrito' => $districtId, 'foto' => $data['photo'] ?? null,
            'impacto' => (int) (bool) ($notifications[0] ?? true),
            'campanas' => (int) (bool) ($notifications[1] ?? true),
            'resumen' => (int) (bool) ($notifications[2] ?? false),
        ]);
        respond(['ok' => true]);
    }

    if ($action === 'changePassword') {
        $actor = require_role($db, ['donante', 'albergue', 'admin']);
        require_fields($data, ['id', 'currentPassword', 'newPassword']);
        if ($data['id'] !== $actor['id']) respond(['error' => 'No puedes cambiar la contraseña de otra cuenta.'], 403);
        $newPassword = (string) $data['newPassword'];
        if (strlen($newPassword) < 8 || !preg_match('/[a-z]/', $newPassword) || !preg_match('/[A-Z]/', $newPassword) || !preg_match('/\d/', $newPassword)) {
            respond(['error' => 'La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.'], 422);
        }
        $lookup = $db->prepare('SELECT clave_hash FROM usuarios WHERE id = :id AND activo = 1');
        $lookup->execute(['id' => $actor['id']]);
        $stored = $lookup->fetchColumn();
        if (!is_string($stored) || !password_is_valid((string) $data['currentPassword'], $stored)) {
            respond(['error' => 'La contraseña actual no es correcta.'], 422);
        }
        $statement = $db->prepare('UPDATE usuarios SET clave_hash = :nueva WHERE id = :id');
        $statement->execute(['id' => $actor['id'], 'nueva' => password_for_storage($db, $newPassword)]);
        session_regenerate_id(true);
        $_SESSION['last_rotation'] = time();
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        respond(['ok' => true, 'csrfToken' => csrf_token()]);
    }

    respond(['error' => 'Acción no encontrada.'], 404);
} catch (PDOException $error) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    $status = str_contains($error->getMessage(), 'Duplicate entry') ? 409 : 500;
    error_log('Corazones API PDO: ' . $error->getMessage());
    respond(['error' => $status === 409 ? 'El registro ya existe o el correo está duplicado.' : 'No se pudo completar la operación.'], $status);
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Corazones API: ' . $error->getMessage());
    respond(['error' => 'Error interno de la API.'], 500);
}
