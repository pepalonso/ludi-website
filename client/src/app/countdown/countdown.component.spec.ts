import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LudiCountdown } from './countdown.component';

describe('CountdownComponent', () => {
  let component: LudiCountdown;
  let fixture: ComponentFixture<LudiCountdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LudiCountdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LudiCountdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
