import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamDesktopComponent } from './detalls-equip-desktop.component';
describe('DetallsDesktopComponent', () => {
  let component: TeamDesktopComponent;
  let fixture: ComponentFixture<TeamDesktopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamDesktopComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamDesktopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
