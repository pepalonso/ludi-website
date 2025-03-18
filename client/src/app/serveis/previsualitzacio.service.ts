import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PrevisualitzacioService {
  private formData: any = {
    dadesGenerals: {},
    dadesJugadors: {},
    dadesEntrenadors: {}
  };

  public setFormData(step: string, data: any) {
    this.formData[step] = data;
  }

  public getFormData() {
    return this.formData;
  }
}
