import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallsEquipComponentMobile } from './detalls-equip-monile.component';

describe('DetallsEquipComponent', () => {
  let component: DetallsEquipComponentMobile;
  let fixture: ComponentFixture<DetallsEquipComponentMobile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallsEquipComponentMobile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallsEquipComponentMobile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
