import { CommonModule } from '@angular/common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import { RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';
import {NotificationService} from "../../../services/notification.service";
import {Subscription} from "rxjs";
import {SocketService} from "../../../services/socket.service";

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  imports:[CommonModule,RouterModule,DropdownComponent,DropdownItemComponent]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  notifying = true;

  page = 1;
  limit = 5;
  notifications: any[] = [];

  private sub!: Subscription;

  constructor(private notifService: NotificationService, private socketService: SocketService) {
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.notifying = false;
  }

  closeDropdown() {
    this.isOpen = false;
  }

  ngOnDestroy() {
    this.sub.unsubscribe(); // éviter les fuites de mémoire
  }

  ngOnInit(): void {
    this.sub = this.socketService.notifications$.subscribe((notif) => {
      this.notifications.unshift(notif);
      if (!this.isOpen) {
        this.notifying = true;
      }
    });

    this.loadNotifications();
  }

  loadNotifications() {
    this.notifService.loadNotifications(this.page, this.limit).subscribe({
      next: (res) => {
        if (res?.success) {
          if (res.data?.items) {
            this.notifications = res.data.items;
            console.log(this.notifications);
          }
        }
      },
      error: (err) => {
        console.error('Error loading boutique orders:', err);
      }
    });
  }
}