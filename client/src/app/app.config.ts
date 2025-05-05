import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// Import Firebase directly
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment.prod';

// Initialize Firebase app at the configuration level
const app = initializeApp(environment.firebase);

// Export the app so components can use it
export const firebaseApp = app;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
  ],
};
