import { Activity, TomaLecheActivity, CambioPanalActivity } from './activity.model';

describe('Activity Models', () => {
  it('should create a TomaLecheActivity', () => {
    const act: TomaLecheActivity = {
      id: '1',
      type: 'toma-leche',
      time: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      cantidadOnzas: 4,
      esLecheMaterna: false,
    };
    expect(act.type).toBe('toma-leche');
    expect(typeof act.cantidadOnzas).toBe('number');
  });

  it('should create a CambioPanalActivity', () => {
    const act: CambioPanalActivity = {
      id: '2',
      type: 'cambio-panal',
      time: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      tieneHeces: true,
    };
    expect(act.type).toBe('cambio-panal');
    expect(typeof act.tieneHeces).toBe('boolean');
  });
});
