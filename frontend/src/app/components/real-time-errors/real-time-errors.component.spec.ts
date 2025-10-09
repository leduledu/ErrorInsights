import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealTimeErrorsComponent } from './real-time-errors.component';

describe('RealTimeErrorsComponent', () => {
  let component: RealTimeErrorsComponent;
  let fixture: ComponentFixture<RealTimeErrorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealTimeErrorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealTimeErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
