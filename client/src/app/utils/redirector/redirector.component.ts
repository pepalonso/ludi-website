import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-redirector',
  standalone: true,
  imports: [],
  template: '<div>Redirigiendo...</div>',
})
export class RedirectorComponent {
  constructor(private router: Router) {}

  ngOnInit() {
    const phone = (environment.contactPhone || '').replace(/\D/g, '');
    window.location.href = `https://wa.me/${phone || '659173158'}`;
  }
}
