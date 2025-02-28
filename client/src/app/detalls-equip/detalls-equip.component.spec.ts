import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallsEquipComponent } from './detalls-equip.component';

describe('DetallsEquipComponent', () => {
  let component: DetallsEquipComponent;
  let fixture: ComponentFixture<DetallsEquipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallsEquipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallsEquipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
