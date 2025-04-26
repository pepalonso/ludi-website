import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class HeaderComponent {
  title = 'Panell Inscripcions Ludibàsquet';

  exportToCsv(): void {
    // TODO: Implementation for CSV export
    console.log('Exporting to CSV...');
  }
}
