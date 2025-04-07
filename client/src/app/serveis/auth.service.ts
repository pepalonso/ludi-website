import { Injectable } from '@angular/core';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor() {}

  /**
   * Returns the Firebase ID token of the currently authenticated user.
   * @returns Promise<string> containing the token.
   */
  getToken(): Promise<string> {
    const auth = getAuth(firebaseApp);
    const user = auth.currentUser;
    if (user) {
      return user.getIdToken();
    } else {
      return Promise.reject('User is not authenticated');
    }
  }
}
