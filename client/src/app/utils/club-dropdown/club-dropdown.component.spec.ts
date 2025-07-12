import { ComponentFixture, TestBed } from '@angular/core/testing'

import { ClubDropdownComponent } from './club-dropdown.component'

describe('ClubDropdownComponent', () => {
  let component: ClubDropdownComponent
  let fixture: ComponentFixture<ClubDropdownComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubDropdownComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ClubDropdownComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
