import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ClubService } from './club.service';

interface Club {
  club_name: string;
  logo_url: string;
}

@Component({
  selector: 'app-input-dropdown',
  templateUrl: './club-dropdown.component.html',
  styleUrls: ['./club-dropdown.component.css'],
  imports: [CommonModule],
  standalone: true,
})
export class ClubDropdownComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  selectedClub: string = '';
  showDropdown: boolean = false;
  private debounceTimeout: any;

  @Output() clubSelected = new EventEmitter<string>();

  constructor(private clubService: ClubService) {}

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    this.clubs = this.clubService.getClubs();
    this.filteredClubs = [...this.clubs];
  }

  toggleDropdown(show: boolean): void {
    this.showDropdown = show;
  }

  onInput(event: Event): void {
    clearTimeout(this.debounceTimeout);
    const inputValue = (event.target as HTMLInputElement).value;
    this.selectedClub = inputValue;
      this.clubSelected.emit(inputValue);

    this.showDropdown = true;

    this.debounceTimeout = setTimeout(() => {
      this.filteredClubs = this.clubs.filter((club) =>
        club.club_name.toLowerCase().includes(inputValue.toLowerCase())
      );
    }, 200);
  }

  selectClub(clubName: string): void {
    this.selectedClub = clubName;
    this.showDropdown = false;
    this.clubSelected.emit(clubName);
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200); // Slight delay to allow click event to register
  }
}
