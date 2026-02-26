import {Component, Input, OnInit} from '@angular/core';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { DropdownItemTwoComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component-two';
import {AuthService} from "../../../services/auth.service";
import {Observable} from "rxjs";
import {JwtPayload} from "../../../../core/models/jwtPayload.model";
import {User} from "../../../../core/models/user.model";
import {LogoutService} from "../../../services/logout.service";

@Component({
  selector: 'app-boutique-dropdown',
  templateUrl: './boutique-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemTwoComponent]
})
export class BoutiqueDropdownComponent implements OnInit {
  user$!: Observable<JwtPayload | null>;
  @Input() userData : User | null | undefined;


  constructor(private authService : AuthService, private router: Router, private logoutService: LogoutService) {
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
    this.closeDropdown();
    this.logoutService.show();

    this.authService.logoutApi().subscribe({
      next: () => {},
      error: () => {},
      complete: () => {
        this.authService.logout();
        setTimeout(() => {
          this.logoutService.hide();
          this.router.navigate(['/']);
        }, 3000);
      }
    });
  }
}