import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FamiliaPage } from './familia.page';

describe('FamiliaPage', () => {
  let component: FamiliaPage;
  let fixture: ComponentFixture<FamiliaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FamiliaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
