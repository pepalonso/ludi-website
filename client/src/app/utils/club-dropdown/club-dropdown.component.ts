import { CommonModule } from '@angular/common';
import { Component, OnInit, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClubDropdownComponent),
      multi: true
    }
  ]
})
export class ClubDropdownComponent implements OnInit, ControlValueAccessor {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  selectedClub: string = '';
  showDropdown: boolean = false;
  private debounceTimeout: any;

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

    this.showDropdown = true;

    this.debounceTimeout = setTimeout(() => {
      this.filteredClubs = this.clubs.filter((club) =>
        club.club_name.toLowerCase().includes(inputValue.toLowerCase())
      );
    }, 200);

    this.selectedClub = (event.target as HTMLInputElement).value;
    this.onChange(this.selectedClub);
  }

  selectClub(clubName: string): void {
    this.selectedClub = clubName;
    this.showDropdown = false;
    this.onChange(clubName);
    this.onTouched();
  }

  onBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
    this.onTouched();
  }

  // Métodos de ControlValueAccessor
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.selectedClub = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
