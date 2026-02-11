import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutUserComponent } from './checkout-user.component';

describe('CheckoutUserComponent', () => {
  let component: CheckoutUserComponent;
  let fixture: ComponentFixture<CheckoutUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
