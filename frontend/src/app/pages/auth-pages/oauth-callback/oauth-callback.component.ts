import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import {ThemeToggleTwoComponent} from "../../../shared/components/common/theme-toggle-two/theme-toggle-two.component";

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterLink, ThemeToggleTwoComponent],
  templateUrl: './oauth-callback.component.html',
  styles: [`
        @keyframes progress {
            0%   { width: 0%; }
            100% { width: 100%; }
        }
        .animate-progress {
            animation: progress 3.5s ease-in-out forwards;
        }
    `]
})
export class OauthCallbackComponent implements OnInit {
  isLoading = true;
  errorMessage = '';

  constructor(
      private authService: AuthService,
      private router: Router,
      private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      this.isLoading = false;
      this.errorMessage = decodeURIComponent(error);
      return;
    }

    const code = this.route.snapshot.queryParamMap.get('code');
    console.log("code = " + code)
    if (code) {
      this.authService.exchangeOAuthCode(code).subscribe({
        next: () => this.doRefresh(),
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Google sign-in failed. Please try again.';
        }
      });
    } else {
      this.doRefresh();
    }
  }

  private doRefresh(): void {
    this.authService.refreshToken().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.success && res?.data?.accessToken) {
          this.router.navigate(['/v1/stores']);
        } else {
          this.errorMessage = res?.message || 'Google sign-in failed.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Google sign-in failed.';
      }
    });
  }

  retryGoogleAuth(): void {
    // this.authService.initiateGoogleLogin();
  }
}