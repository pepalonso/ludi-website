import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  contactPhone = environment.contactPhone;
  /** Display format with spaces (e.g. 659 17 31 58) */
  get contactPhoneDisplay(): string {
    const s = this.contactPhone.replace(/\D/g, '');
    return s.length >= 9 ? `${s.slice(0, 3)} ${s.slice(3, 5)} ${s.slice(5, 7)} ${s.slice(7, 9)}` : s || this.contactPhone;
  }
}
