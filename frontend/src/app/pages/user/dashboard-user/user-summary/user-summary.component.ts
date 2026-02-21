import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {UserService} from "../../../../shared/services/user.service";
import {ToastService} from "../../../../shared/services/toast.service";

interface UserInfo {
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  createdAt: string;
}

@Component({
  selector: 'app-user-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-summary.component.html',
})
export class UserSummaryComponent implements OnInit {

  user: UserInfo | null = null;
  isLoading = true;

  constructor(
      private userService: UserService,
      private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.userService.getMyInfo().subscribe({
      next: (res) => {
        if (res.success) {
          this.user = res.data;
        } else {
          this.toast.error('Error', res.message ?? 'Failed to load profile.', 0);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load profile.', 0);
        this.isLoading = false;
      }
    });
  }

  getInitials(): string {
    if (!this.user?.name) return '?';
    return this.user.name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
  }

  getMemberDuration(): string {
    if (!this.user?.createdAt) return '';
    const now = new Date();
    const diff = now.getTime() - new Date(this.user.createdAt).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    if (months < 1) return 'Just joined';
    if (months < 12) return `Member for ${months} month${months > 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    return `Member for ${years} year${years > 1 ? 's' : ''}`;
  }
}