import { CommonModule } from '@angular/common';
import {Component, OnDestroy, OnInit, ElementRef, ViewChild, SecurityContext} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { NotificationService } from "../../../services/notification.service";
import { Subscription } from "rxjs";
import { SocketService } from "../../../services/socket.service";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  @ViewChild('notifList') notifList!: ElementRef;

  isOpen = false;
  notifying = false;

  page = 1;
  limit = 6;
  notifications: any[] = [];

  // NEW: Use global unread count from API
  totalUnread = 0; // Global unread count from server

  totalDocs = 0;

  isLoadingMore = false;
  hasMoreToLoad = false;
  showLoadMoreButton = false;
  isFirstLoad = true;

  private sub!: Subscription;
  private scrollSub?: Subscription;

  constructor(
      private notifService: NotificationService,
      private socketService: SocketService,
      private router: Router,
      private sanitizer: DomSanitizer
  ) {}

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.notifying = false;
      if (this.isFirstLoad) {
        this.setupScrollListener();
      }
    }
  }

  closeDropdown() {
    this.isOpen = false;
  }

  sanitizeMessage(message: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, message) || message;
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.scrollSub) {
      this.scrollSub.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.sub = this.socketService.notifications$.subscribe((notif) => {
      this.notifications.unshift(notif);

      // Update counts when new notification arrives
      if (!notif.isRead) {
        this.totalUnread++; // Increment global count
        if (!this.isOpen) {
          this.notifying = true;
        }
      }
      this.totalDocs++; // Increment total when new notif arrives
    });

    this.loadNotifications();
  }

  loadNotifications() {
    this.notifService.loadNotifications(this.page, this.limit).subscribe({
      next: (res) => {
        if (res?.success) {
          if (res.data?.advanced.items) {
            this.notifications = res.data.advanced.items;
            this.totalDocs = res.data.advanced.pagination?.totalDocs || 0;

            // NEW: Use totalUnread from API response
            this.totalUnread = res.data?.totalUnread || 0;
            this.notifying = this.totalUnread > 0;

            this.updateLoadMoreState();
          }
        }
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
      }
    });
  }

  loadMoreNotifications() {
    if (this.isLoadingMore || !this.hasMoreToLoad) return;

    this.isLoadingMore = true;
    this.page++;

    this.notifService.loadNotifications(this.page, this.limit).subscribe({
      next: (res) => {
        this.isLoadingMore = false;
        if (res?.success && res.data?.advanced.items) {
          // Merge new notifications
          this.notifications = [...this.notifications, ...res.data.advanced.items];
          this.totalDocs = res.data.advanced.pagination?.totalDocs || 0;

          // NEW: Update totalUnread from API (should remain the same, but good to sync)
          this.totalUnread = res.data?.totalUnread || 0;
          this.notifying = this.totalUnread > 0;

          this.updateLoadMoreState();

          // Hide button after first manual load
          if (this.isFirstLoad) {
            this.isFirstLoad = false;
            this.showLoadMoreButton = false;
          }
        }
      },
      error: (err) => {
        console.error('Error loading more notifications:', err);
        this.isLoadingMore = false;
      }
    });
  }

  updateLoadMoreState() {
    const loadedCount = this.notifications.length;
    this.hasMoreToLoad = loadedCount < this.totalDocs;

    // Show button only on first load if there's more data
    if (this.isFirstLoad) {
      this.showLoadMoreButton = this.hasMoreToLoad;
    }
  }

  setupScrollListener() {
    if (!this.notifList) {
      setTimeout(() => this.setupScrollListener(), 100);
      return;
    }

    const container = this.notifList.nativeElement;
    container.addEventListener('scroll', () => {
      if (!this.isFirstLoad && !this.isLoadingMore && this.hasMoreToLoad) {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // Load more when scrolled to 90% of container
        if (scrollTop + clientHeight >= scrollHeight * 0.9) {
          this.loadMoreNotifications();
        }
      }
    });
  }

  markAllAsRead() {
    this.notifService.markAllAsRead().subscribe({
      next: (res) => {
        if (res?.success) {
          this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
          this.totalUnread = 0;
          this.notifying = false;
        }
      },
      error: (err) => {
        console.error('Error marking all notifications as read:', err);
      }
    });
  }

  onNotificationClick(notification: any) {
    if (!notification.isRead) {
      this.notifService.markAsRead(notification._id).subscribe({
        next: (res) => {
          if (res?.success) {
            notification.isRead = true;
            this.totalUnread = Math.max(0, this.totalUnread - 1);
            this.notifying = this.totalUnread > 0;
          }
        },
        error: (err) => {
          console.error('Error marking notification as read:', err);
        }
      });
    }

    this.closeDropdown();

    if (notification.url) {
      this.router.navigate([notification.url]);
    }
  }

  getNotificationIcon(notification: any): string {
    // CHANGED: Use severity for icon selection when appropriate

    // Special icons for severity
    if (notification.severity === 'error') {
      return 'error';
    }
    if (notification.severity === 'warning') {
      return 'warning';
    }
    if (notification.severity === 'success') {
      return 'success';
    }

    // Channel-based icons
    switch (notification.channel) {
      case 'order':
        return 'order';
      case 'sale':
        return 'sale';
      case 'stock':
        return 'stock';
      case 'message':
        return 'message';
      case 'system':
      default:
        return 'system';
    }
  }

  getNotificationColor(notification: any): string {
    // CHANGED: Priority to severity over channel
    if (notification.severity) {
      switch (notification.severity) {
        case 'success':
          return 'green';
        case 'error':
          return 'red';
        case 'warning':
          return 'amber';
        case 'info':
        default:
          return 'blue';
      }
    }

    // Fallback to channel-based colors if no severity
    switch (notification.channel) {
      case 'order':
        return 'blue';
      case 'sale':
        return 'green';
      case 'stock':
        return 'amber';
      case 'message':
        return 'purple';
      case 'system':
      default:
        return 'gray';
    }
  }


  formatTimestamp(timestamp: string): string {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return notifDate.toLocaleDateString();
  }
}