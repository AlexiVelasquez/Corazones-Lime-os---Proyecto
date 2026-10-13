<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://127.0.0.1:8080', 'http://localhost:4200', 'http://127.0.0.1:4200'];
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
}
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
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
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        respond(['error' => 'El cuerpo JSON no es válido.'], 400);
    }
    return $data;
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

function bootstrap(PDO $db): array
{
    $accounts = array_map('account_row', $db->query(
        'SELECT u.id, r.codigo AS rol, u.nombres, u.apellidos, u.correo, u.telefono,
                COALESCE(di.nombre, "") AS distrito, u.foto,
                u.notificar_impacto, u.notificar_campanas, u.notificar_resumen
         FROM usuarios u
         INNER JOIN roles r ON r.id = u.rol_id
         LEFT JOIN distritos di ON di.id = u.distrito_id
         WHERE u.activo = 1 ORDER BY u.creado_en'
    )->fetchAll());

    $shelters = array_map(static fn(array $row): array => [
        'id' => $row['id'],
        'name' => $row['nombre'],
        'district' => $row['distrito'],
        'status' => $row['estado'],
    ], $db->query(
        'SELECT a.id, a.nombre, di.nombre AS distrito, a.estado
         FROM albergues a INNER JOIN distritos di ON di.id = a.distrito_id
         ORDER BY a.creado_en'
    )->fetchAll());

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
    ], $db->query(
        'SELECT d.*, u.nombres, u.apellidos, dd.descripcion, dd.cantidad,
                dd.estado_articulos, ca.nombre AS categoria
         FROM donaciones d
         INNER JOIN usuarios u ON u.id = d.donante_id
         INNER JOIN detalle_donacion dd ON dd.id = (
             SELECT MIN(dd2.id) FROM detalle_donacion dd2 WHERE dd2.donacion_id = d.id
         )
         INNER JOIN categorias_articulo ca ON ca.id = dd.categoria_id
         ORDER BY d.creado_en DESC'
    )->fetchAll());

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

    return compact('accounts', 'shelters', 'donations', 'needs');
}

try {
    $db = database();
    $action = $_GET['action'] ?? 'health';

    if ($action === 'health') {
        $db->query('SELECT 1');
        respond(['ok' => true, 'database' => 'corazones_limenos']);
    }

    if ($action === 'bootstrap' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        respond(bootstrap($db));
    }

    $data = body();

    if ($action === 'login') {
        require_fields($data, ['email', 'password']);
        $statement = $db->prepare(
            'SELECT u.id, r.codigo AS rol, u.nombres, u.apellidos, u.correo, u.telefono,
                    COALESCE(di.nombre, "") AS distrito, u.foto,
                    u.notificar_impacto, u.notificar_campanas, u.notificar_resumen
             FROM usuarios u
             INNER JOIN roles r ON r.id = u.rol_id
             LEFT JOIN distritos di ON di.id = u.distrito_id
             WHERE u.correo = :correo AND u.clave_hash = SHA2(:clave, 256) AND u.activo = 1'
        );
        $statement->execute(['correo' => strtolower(trim((string) $data['email'])), 'clave' => (string) $data['password']]);
        $account = $statement->fetch();
        if (!$account) {
            respond(['error' => 'Correo o contraseña incorrectos.'], 401);
        }
        respond(['account' => account_row($account)]);
    }

    if ($action === 'createDonation') {
        require_fields($data, ['id', 'donor', 'shelter', 'category', 'description', 'quantity', 'method', 'date']);
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
            'direccion' => $data['address'] ?? '', 'referencia' => $data['reference'] ?? '',
            'horario' => $data['time'] ?? '', 'fecha' => $data['date'],
            'estado' => $data['status'] ?? 'Pendiente',
        ]);
        $detail = $db->prepare(
            'INSERT INTO detalle_donacion
             (donacion_id, categoria_id, descripcion, cantidad, estado_articulos)
             VALUES (:donacion, :categoria, :descripcion, :cantidad, :condicion)'
        );
        $detail->execute([
            'donacion' => $data['id'], 'categoria' => $categoryId,
            'descripcion' => $data['description'], 'cantidad' => (int) $data['quantity'],
            'condicion' => $data['condition'] ?? 'nuevo',
        ]);
        $tracking = $db->prepare(
            'INSERT INTO seguimiento_donacion (donacion_id, estado, comentario, registrado_por)
             VALUES (:donacion, :estado, :comentario, :usuario)'
        );
        $tracking->execute([
            'donacion' => $data['id'], 'estado' => $data['status'] ?? 'Pendiente',
            'comentario' => 'Donación registrada desde la plataforma.', 'usuario' => $data['donor'],
        ]);
        $db->commit();
        respond(['ok' => true], 201);
    }

    if ($action === 'createNeed') {
        require_fields($data, ['shelter', 'description', 'category']);
        $categoryId = category_id($db, (string) $data['category']);
        $statement = $db->prepare(
            'INSERT INTO necesidades (albergue_id, categoria_id, descripcion, activa)
             VALUES (:albergue, :categoria, :descripcion, 1)'
        );
        $statement->execute([
            'albergue' => $data['shelter'], 'descripcion' => $data['description'],
            'categoria' => $categoryId,
        ]);
        respond(['ok' => true, 'id' => 'N' . $db->lastInsertId()], 201);
    }

    if ($action === 'updateNeed') {
        require_fields($data, ['id', 'active']);
        $statement = $db->prepare('UPDATE necesidades SET activa = :activa WHERE id = :id');
        $statement->execute(['activa' => (int) (bool) $data['active'], 'id' => ltrim((string) $data['id'], 'N')]);
        respond(['ok' => true]);
    }

    if ($action === 'updateDonationStatus') {
        require_fields($data, ['id', 'status']);
        $db->beginTransaction();
        $statement = $db->prepare('UPDATE donaciones SET estado = :estado WHERE id = :id');
        $statement->execute(['estado' => $data['status'], 'id' => $data['id']]);
        $tracking = $db->prepare(
            'INSERT INTO seguimiento_donacion (donacion_id, estado, comentario)
             VALUES (:donacion, :estado, :comentario)'
        );
        $tracking->execute([
            'donacion' => $data['id'], 'estado' => $data['status'],
            'comentario' => 'Estado actualizado desde el panel de gestión.',
        ]);
        $db->commit();
        respond(['ok' => true]);
    }

    if ($action === 'updateShelterStatus') {
        require_fields($data, ['id', 'status']);
        $statement = $db->prepare('UPDATE albergues SET estado = :estado WHERE id = :id');
        $statement->execute(['estado' => $data['status'], 'id' => $data['id']]);
        respond(['ok' => true]);
    }

    if ($action === 'saveMessage') {
        require_fields($data, ['name', 'email', 'subject', 'message']);
        $statement = $db->prepare(
            'INSERT INTO mensajes_contacto (nombre, correo, asunto, mensaje)
             VALUES (:nombre, :correo, :asunto, :mensaje)'
        );
        $statement->execute([
            'nombre' => $data['name'], 'correo' => $data['email'],
            'asunto' => $data['subject'], 'mensaje' => $data['message'],
        ]);
        respond(['ok' => true], 201);
    }

    if ($action === 'updateProfile') {
        require_fields($data, ['id', 'name', 'email', 'phone', 'district']);
        $notifications = $data['notifications'] ?? [true, true, false];
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
            'id' => $data['id'], 'nombres' => $data['name'], 'apellidos' => $data['surname'] ?? '',
            'correo' => strtolower(trim((string) $data['email'])), 'telefono' => $data['phone'],
            'distrito' => $districtId, 'foto' => $data['photo'] ?? null,
            'impacto' => (int) (bool) ($notifications[0] ?? true),
            'campanas' => (int) (bool) ($notifications[1] ?? true),
            'resumen' => (int) (bool) ($notifications[2] ?? false),
        ]);
        respond(['ok' => true]);
    }

    if ($action === 'changePassword') {
        require_fields($data, ['id', 'currentPassword', 'newPassword']);
        $statement = $db->prepare(
            'UPDATE usuarios SET clave_hash = SHA2(:nueva, 256)
             WHERE id = :id AND clave_hash = SHA2(:actual, 256)'
        );
        $statement->execute([
            'id' => $data['id'], 'actual' => $data['currentPassword'], 'nueva' => $data['newPassword'],
        ]);
        if ($statement->rowCount() !== 1) {
            respond(['error' => 'La contraseña actual no es correcta.'], 422);
        }
        respond(['ok' => true]);
    }

    respond(['error' => 'Acción no encontrada.'], 404);
} catch (PDOException $error) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    $status = str_contains($error->getMessage(), 'Duplicate entry') ? 409 : 500;
    respond([
        'error' => $status === 409 ? 'El registro ya existe o el correo está duplicado.' : 'No se pudo acceder a MySQL.',
        'detail' => $error->getMessage(),
    ], $status);
} catch (Throwable $error) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    respond(['error' => 'Error interno de la API.', 'detail' => $error->getMessage()], 500);
}
