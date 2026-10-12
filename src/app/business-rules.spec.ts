import { DonationRules, DonationStatusRules, ProfileRules } from './business-rules';

describe('1. Pruebas de categoría de donación', () => {
  it('CP-UNIT-001 acepta la categoría Juguetes', () => {
    expect(DonationRules.validateCategory('Juguetes').valid).toBe(true);
  });

  it('CP-UNIT-002 rechaza una categoría vacía o desconocida', () => {
    expect(DonationRules.validateCategory('').valid).toBe(false);
    expect(DonationRules.validateCategory('Dinero').valid).toBe(false);
  });
});

describe('2. Pruebas del detalle de la donación', () => {
  it('CP-UNIT-003 acepta una descripción válida y una cantidad dentro del rango', () => {
    expect(DonationRules.validateDetails('Cinco pelotas nuevas', 5).valid).toBe(true);
  });

  it('CP-UNIT-004 rechaza descripciones menores de cinco caracteres', () => {
    expect(DonationRules.validateDetails('pan', 1)).toEqual({
      valid: false,
      message: 'Describe tus artículos con al menos 5 caracteres.',
    });
  });

  it.each([0, 1001, 1.5, Number.NaN])(
    'CP-UNIT-005 rechaza la cantidad inválida %s',
    quantity => expect(DonationRules.validateDetails('Caja de alimentos', quantity).valid).toBe(false),
  );

  it('CP-UNIT-006 acepta los valores límite 1 y 1000', () => {
    expect(DonationRules.validateDetails('Caja de alimentos', 1).valid).toBe(true);
    expect(DonationRules.validateDetails('Caja de alimentos', 1000).valid).toBe(true);
  });

  it('CP-UNIT-010 limita el contador al rango permitido', () => {
    expect(DonationRules.clampQuantity(-5)).toBe(1);
    expect(DonationRules.clampQuantity(15)).toBe(15);
    expect(DonationRules.clampQuantity(1500)).toBe(1000);
  });
});

describe('3. Pruebas del método de entrega', () => {
  it('CP-UNIT-007 exige un distrito para entrega en punto de recojo', () => {
    expect(DonationRules.validateDelivery({ method: 'dropoff', district: '', address: '', time: '' }).valid).toBe(false);
    expect(DonationRules.validateDelivery({ method: 'dropoff', district: 'Miraflores', address: '', time: '' }).valid).toBe(true);
  });

  it('CP-UNIT-008 exige dirección y horario para recojo a domicilio', () => {
    expect(DonationRules.validateDelivery({ method: 'pickup', district: '', address: 'Av. Lima 123', time: 'Mañana' }).valid).toBe(true);
    expect(DonationRules.validateDelivery({ method: 'pickup', district: '', address: 'Av. 1', time: '' }).valid).toBe(false);
  });

  it('CP-UNIT-009 solo permite registrar la donación para un albergue aprobado', () => {
    const draft = { category: 'Víveres', description: 'Diez bolsas de arroz', quantity: 10, method: 'dropoff', district: 'Comas', address: '', time: '', shelter: 'renacer' };
    expect(DonationRules.validateSubmission(draft, ['esperanza', 'renacer']).valid).toBe(true);
    expect(DonationRules.validateSubmission(draft, ['esperanza']).valid).toBe(false);
  });

});

describe('4. Pruebas de estados y permisos por rol', () => {
  it('CP-UNIT-011 permite al administrador asignar una donación pendiente', () => {
    expect(DonationStatusRules.transition('Pendiente', 'admin')).toBe('En tránsito');
  });

  it('CP-UNIT-012 permite al albergue confirmar una donación en tránsito', () => {
    expect(DonationStatusRules.transition('En tránsito', 'albergue')).toBe('Entregado');
  });

  it('CP-UNIT-013 impide cambios de estado por roles no autorizados', () => {
    expect(DonationStatusRules.transition('Pendiente', 'donante')).toBe('Pendiente');
    expect(DonationStatusRules.transition('En tránsito', 'admin')).toBe('En tránsito');
    expect(DonationStatusRules.transition('Entregado', 'albergue')).toBe('Entregado');
  });
});

describe('5. Pruebas del perfil del usuario', () => {
  it('CP-UNIT-014 valida el formato del correo', () => {
    expect(ProfileRules.isValidEmail('persona@calidad.pe')).toBe(true);
    expect(ProfileRules.isValidEmail('correo-invalido')).toBe(false);
  });

  it('CP-UNIT-015 valida teléfonos entre 9 y 15 dígitos', () => {
    expect(ProfileRules.isValidPhone('+51 987654321')).toBe(true);
    expect(ProfileRules.isValidPhone('123')).toBe(false);
  });

  it('CP-UNIT-016 acepta un cambio de contraseña consistente', () => {
    expect(ProfileRules.validatePasswordChange('Actual123', 'Actual123', 'Nueva123!', 'Nueva123!').valid).toBe(true);
  });

  it('CP-UNIT-017 rechaza una contraseña actual incorrecta', () => {
    expect(ProfileRules.validatePasswordChange('Incorrecta', 'Actual123', 'Nueva123!', 'Nueva123!').valid).toBe(false);
  });

  it('CP-UNIT-018 rechaza contraseñas nuevas diferentes', () => {
    expect(ProfileRules.validatePasswordChange('Actual123', 'Actual123', 'Nueva123!', 'Otra123!').valid).toBe(false);
  });
});
