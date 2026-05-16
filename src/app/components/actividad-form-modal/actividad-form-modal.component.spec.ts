import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActividadFormModalComponent } from './actividad-form-modal.component';

describe('ActividadFormModalComponent', () => {
  let component: ActividadFormModalComponent;
  let fixture: ComponentFixture<ActividadFormModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ActividadFormModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActividadFormModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
