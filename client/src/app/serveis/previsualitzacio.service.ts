import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class PrevisualitzacioService {
  private formData = new BehaviorSubject<any>({})

  public setFormData(stepData: any) {
    const currentData = this.formData.value
    this.formData.next({ ...currentData, ...stepData })
  }

  public getFormData() {
    return this.formData.asObservable()
  }
}
