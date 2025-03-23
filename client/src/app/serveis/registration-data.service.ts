import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RegistrationStateService {
  private _state: any = null;

  set state(value: any) {
    this._state = value;
  }

  get state(): any {
    return this._state;
  }

  clearState(): void {
    this._state = null;
  }
}
