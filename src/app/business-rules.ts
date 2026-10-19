export type DeliveryMethod = 'dropoff' | 'pickup';
export type DonationStatus = 'Pendiente' | 'En tránsito' | 'Entregado';
export type UserRole = 'donante' | 'albergue' | 'admin';
export type PublicRegistrationRole = Exclude<UserRole, 'admin'>;
export type ProtectedArea = 'donation' | 'donor-panel' | 'shelter-panel' | 'admin-panel' | 'profile';

export interface RegistrationData {
  role: PublicRegistrationRole;
  name: string;
  surname: string;
  shelterName: string;
  email: string;
  phone: string;
  district: string;
  password: string;
  repeatPassword: string;
  ruc: string;
  address: string;
  description: string;
  acceptTerms: boolean;
}

export interface AdminAccountData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  district: string;
  password: string;
  repeatPassword: string;
}

export interface DonationFormData {
  category: string;
  description: string;
  quantity: number;
  method: string;
  district: string;
  address: string;
  time: string;
  shelter: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
}

export interface SafeCoordinates {
  latitude: number;
  longitude: number;
}

const valid = (): ValidationResult => ({ valid: true, message: '' });
const invalid = (message: string): ValidationResult => ({ valid: false, message });

/** Reglas puras del flujo de donación. No dependen de Angular ni del navegador. */
export class DonationRules {
  static readonly categories = ['Juguetes', 'Víveres'];

  static validateCategory(category: string): ValidationResult {
    return this.categories.includes(category)
      ? valid()
      : invalid('Selecciona Juguetes o Víveres para continuar.');
  }

  static validateDetails(description: string, quantity: number): ValidationResult {
    if (description.trim().length < 5) {
      return invalid('Describe tus artículos con al menos 5 caracteres.');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      return invalid('La cantidad debe ser un número entero entre 1 y 1000 cajas.');
    }
    return valid();
  }

  static validateDelivery(data: Pick<DonationFormData, 'method' | 'district' | 'address' | 'time'>): ValidationResult {
    if (data.method === 'dropoff') {
      return data.district.trim() ? valid() : invalid('Selecciona un punto de recojo.');
    }
    if (data.method === 'pickup') {
      return data.address.trim().length >= 8 && Boolean(data.time)
        ? valid()
        : invalid('Completa la dirección y el horario de recojo.');
    }
    return invalid('Selecciona un método de entrega válido.');
  }

  static validateSubmission(data: DonationFormData, approvedShelterIds: string[]): ValidationResult {
    const category = this.validateCategory(data.category);
    if (!category.valid) return category;
    const details = this.validateDetails(data.description, data.quantity);
    if (!details.valid) return details;
    const delivery = this.validateDelivery(data);
    if (!delivery.valid) return delivery;
    return approvedShelterIds.includes(data.shelter)
      ? valid()
      : invalid('Selecciona un albergue aprobado.');
  }

  static clampQuantity(quantity: number): number {
    return Math.max(1, Math.min(1000, quantity));
  }
}

/** Reglas para los cambios de estado según el rol que ejecuta la acción. */
export class DonationStatusRules {
  static transition(status: DonationStatus, role: UserRole): DonationStatus {
    if (role === 'admin' && status === 'Pendiente') return 'En tránsito';
    if (role === 'albergue' && status === 'En tránsito') return 'Entregado';
    return status;
  }
}

/** Matriz central de autorización usada por las rutas y cubierta por pruebas. */
export class AccessRules {
  private static readonly permissions: Record<ProtectedArea, UserRole[]> = {
    donation: ['donante'],
    'donor-panel': ['donante'],
    'shelter-panel': ['albergue'],
    'admin-panel': ['admin'],
    profile: ['donante', 'albergue', 'admin'],
  };

  static canAccess(role: UserRole | null | undefined, area: ProtectedArea): boolean {
    return Boolean(role && this.permissions[area].includes(role));
  }

  /** Solo admite destinos internos que correspondan al rol autenticado. */
  static safeReturnUrl(role: UserRole, returnUrl: string | null): string | null {
    if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) return null;
    if (returnUrl === '/perfil') return returnUrl;
    if (/^\/donar(?:\/detalle|\/entrega)?$/.test(returnUrl)) {
      return role === 'donante' ? returnUrl : null;
    }
    const panel = `/panel/${role}`;
    return returnUrl === panel || returnUrl === `${panel}/donaciones` || returnUrl === `${panel}/albergues`
      ? returnUrl
      : null;
  }
}

/** Validaciones reutilizables del perfil y seguridad. */
export class ProfileRules {
  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  static isValidPhone(phone: string): boolean {
    return /^\+?[\d\s]{9,15}$/.test(phone.trim());
  }

  static validatePasswordChange(current: string, stored: string, next: string, repeat: string): ValidationResult {
    if (current !== stored) return invalid('La contraseña actual no es correcta.');
    if (next.length < 8 || !/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/\d/.test(next)) {
      return invalid('La nueva contraseña debe tener 8 caracteres, mayúscula, minúscula y número.');
    }
    if (next !== repeat) return invalid('Las contraseñas nuevas no coinciden.');
    return valid();
  }
}

/** Reglas del registro público. El rol administrador nunca se crea desde la web. */
export class RegistrationRules {
  static validate(data: RegistrationData): ValidationResult {
    if (!['donante', 'albergue'].includes(data.role)) {
      return invalid('Selecciona un tipo de cuenta permitido.');
    }
    if (data.name.trim().length < 2 || data.surname.trim().length < 2) {
      return invalid('Ingresa los nombres y apellidos del responsable.');
    }
    if (!ProfileRules.isValidEmail(data.email)) return invalid('Ingresa un correo electrónico válido.');
    if (!ProfileRules.isValidPhone(data.phone)) return invalid('Ingresa un teléfono de 9 a 15 dígitos.');
    if (!data.district) return invalid('Selecciona tu distrito.');
    if (data.password.length < 8 || !/[a-z]/.test(data.password) || !/[A-Z]/.test(data.password) || !/\d/.test(data.password)) {
      return invalid('La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.');
    }
    if (data.password !== data.repeatPassword) return invalid('Las contraseñas no coinciden.');
    if (!data.acceptTerms) return invalid('Debes aceptar los términos y la política de privacidad.');
    if (data.role === 'albergue') {
      if (data.shelterName.trim().length < 3) return invalid('Ingresa el nombre del albergue.');
      if (!/^\d{11}$/.test(data.ruc)) return invalid('El RUC del albergue debe contener 11 dígitos.');
      if (data.address.trim().length < 8) return invalid('Ingresa la dirección completa del albergue.');
      if (data.description.trim().length < 20) return invalid('Describe la labor del albergue con al menos 20 caracteres.');
    }
    return valid();
  }
}

/** La creación de administradores requiere una sesión administrativa activa. */
export class AdminAccountRules {
  static validate(actorRole: UserRole | null | undefined, data: AdminAccountData): ValidationResult {
    if (actorRole !== 'admin') return invalid('Solo un administrador puede crear otra cuenta administrativa.');
    if (data.name.trim().length < 2 || data.surname.trim().length < 2) return invalid('Ingresa nombres y apellidos válidos.');
    if (!ProfileRules.isValidEmail(data.email)) return invalid('Ingresa un correo electrónico válido.');
    if (!ProfileRules.isValidPhone(data.phone)) return invalid('Ingresa un teléfono de 9 a 15 dígitos.');
    if (!data.district) return invalid('Selecciona el distrito del administrador.');
    if (data.password.length < 8 || !/[a-z]/.test(data.password) || !/[A-Z]/.test(data.password) || !/\d/.test(data.password)) {
      return invalid('La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.');
    }
    if (data.password !== data.repeatPassword) return invalid('Las contraseñas no coinciden.');
    return valid();
  }
}

/** Construye enlaces de Google Maps únicamente a partir de coordenadas numéricas validadas. */
export class MapRules {
  static readonly limaCenter: SafeCoordinates = { latitude: -12.0464, longitude: -77.0428 };

  static validCoordinates(latitude: unknown, longitude: unknown): boolean {
    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  static safeCoordinates(latitude: unknown, longitude: unknown): SafeCoordinates {
    return this.validCoordinates(latitude, longitude)
      ? { latitude: Number(latitude), longitude: Number(longitude) }
      : this.limaCenter;
  }

  static searchUrl(latitude: unknown, longitude: unknown): string {
    const point = this.safeCoordinates(latitude, longitude);
    const query = encodeURIComponent(`${point.latitude},${point.longitude}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}&utm_source=corazones_limenos&utm_campaign=sede`;
  }

  static directionsUrl(latitude: unknown, longitude: unknown): string {
    const point = this.safeCoordinates(latitude, longitude);
    const destination = encodeURIComponent(`${point.latitude},${point.longitude}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&utm_source=corazones_limenos&utm_campaign=como_llegar`;
  }

  static embedUrl(latitude: unknown, longitude: unknown, zoom = 15): string {
    const point = this.safeCoordinates(latitude, longitude);
    const safeZoom = Math.max(10, Math.min(19, Number.isInteger(zoom) ? zoom : 15));
    return `https://maps.google.com/maps?q=${point.latitude},${point.longitude}&z=${safeZoom}&output=embed`;
  }
}
