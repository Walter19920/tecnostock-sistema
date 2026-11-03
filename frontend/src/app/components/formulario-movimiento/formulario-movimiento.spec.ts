import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormularioMovimiento } from './formulario-movimiento';

describe('FormularioMovimiento', () => {
  let component: FormularioMovimiento;
  let fixture: ComponentFixture<FormularioMovimiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioMovimiento],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioMovimiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
