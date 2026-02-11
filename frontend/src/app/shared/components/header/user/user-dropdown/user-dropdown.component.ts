import {Component, OnInit} from '@angular/core';
import { DropdownComponent } from '../../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { DropdownItemTwoComponent } from '../../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import {AuthService} from "../../../../services/auth.service";
import {User} from "../../../../../core/models/user.model";
import {Observable} from "rxjs";

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class UserDropdownComponent implements OnInit {
  user$!: Observable<User | null>;

  constructor(private authService : AuthService, private router: Router) {
  }

  ngOnInit() {
    this.user$ = this.authService.user$;
  }

  isOpen = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  onSignOut() {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}