import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-redirector',
  standalone: true,
  imports: [],
  template: '<div>Redirigiendo...</div>',
})
export class RedirectorComponent {
  constructor(private router: Router) {}

  ngOnInit() {
    window.location.href = 'https://wa.me/659173158';
  }
}
