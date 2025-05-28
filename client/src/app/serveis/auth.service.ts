import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  getAuth,
  onAuthStateChanged,
  User,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { firebaseApp } from '../app.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = getAuth(firebaseApp);
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor() {
    // Initialize persistence
    this.initializePersistence();

    // Keep track of auth state changes
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  private async initializePersistence() {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
    } catch (error) {
      console.error('Error setting auth persistence:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Returns Firebase ID token of the authenticated user.
   */
  getToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (user) {
      return user.getIdToken();
    } else {
      return Promise.reject('User is not authenticated');
    }
  }

  /**
   * Observable to react to auth state changes
   */
  user$ = this.currentUserSubject.asObservable();
}
