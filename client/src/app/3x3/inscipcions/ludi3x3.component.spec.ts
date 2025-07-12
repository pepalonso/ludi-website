import { ComponentFixture, TestBed } from '@angular/core/testing'

import { Ludi3x3Component } from './ludi3x3.component'

describe('Ludi3x3Component', () => {
  let component: Ludi3x3Component
  let fixture: ComponentFixture<Ludi3x3Component>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ludi3x3Component],
    }).compileComponents()

    fixture = TestBed.createComponent(Ludi3x3Component)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
