import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablaMovimientos } from './tabla-movimientos';

describe('TablaMovimientos', () => {
  let component: TablaMovimientos;
  let fixture: ComponentFixture<TablaMovimientos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaMovimientos],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaMovimientos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
