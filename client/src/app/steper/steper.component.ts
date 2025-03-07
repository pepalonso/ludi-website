import {Component, Input} from '@angular/core';
import { CdkStepper, CdkStepperModule } from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-steper',
  standalone: true,
  providers: [{provide: CdkStepper, useExisting: SteperComponent}],
  imports: [NgTemplateOutlet, CdkStepperModule],
  templateUrl: './steper.component.html',
  styleUrl: './steper.component.css'
})
export class SteperComponent extends CdkStepper {
  @Input() public stepNames: any;

  selectStepByIndex(index: number): void {
    this.selectedIndex = index;
    console.info(this.stepNames)
  }

  getStepName(id: number): string {
    return this.stepNames.find((s: { id: number; }) => s.id === id)?.name;
  }
}
