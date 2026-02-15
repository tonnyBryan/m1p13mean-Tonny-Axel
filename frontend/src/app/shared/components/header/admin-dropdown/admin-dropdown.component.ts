import {Component, Input, OnInit} from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {AuthService} from "../../../services/auth.service";
import {User} from "../../../../core/models/user.model";
import {Observable} from "rxjs";
import {JwtPayload} from "../../../../core/models/jwtPayload.model";

@Component({
  selector: 'app-admin-dropdown',
  templateUrl: './admin-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent]
})
export class AdminDropdownComponent implements OnInit{
  user$!: Observable<JwtPayload | null>;
  @Input() userData : User | null | undefined;


  constructor(private authService : AuthService, private router: Router) {
  }

  ngOnInit() {
    this.user$ = this.authService.userToken$;
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