import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FamiliaInicialPage } from './familia-inicial.page';

describe('FamiliaInicialPage', () => {
  let component: FamiliaInicialPage;
  let fixture: ComponentFixture<FamiliaInicialPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FamiliaInicialPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
