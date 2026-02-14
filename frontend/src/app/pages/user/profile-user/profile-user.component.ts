import { Component, OnInit } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../../shared/components/user-profile/user-info-card/user-info-card.component';
import { UserAddressCardComponent } from '../../../shared/components/user-profile/user-address-card/user-address-card.component';
import { UserService } from '../../../shared/services/user.service';
import {NgIf} from "@angular/common";
import {AuthService} from "../../../shared/services/auth.service";
import {ToastService} from "../../../shared/services/toast.service";

@Component({
    selector: 'app-profile-user',
    standalone: true,
    imports: [
        PageBreadcrumbComponent,
        UserMetaCardComponent,
        UserInfoCardComponent,
        UserAddressCardComponent,
        NgIf
    ],
    templateUrl: './profile-user.component.html',
    styleUrls: ['./profile-user.component.css']
})
export class ProfileUserComponent implements OnInit {

    pageTitle = 'Profile';

    profile: any = null; // will hold UserProfile or null
    isLoading = false;

    // fallback mocked user data when profile not found
    mockedUser = {
        _id: null,
        firstName: '--',
        lastName: '--',
        phoneNumber: '--',
        photo: '/images/user/owner.jpg',
        description: '--',
        addresses: []
    };

    constructor(private userService: UserService, private authService: AuthService, private toast : ToastService) {}

    ngOnInit(): void {
        console.log("gegee brooo");
        this.loadProfile();
    }

    loadProfile(): void {
        this.isLoading = true;
        this.userService.getMyProfile().subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res && res.success && res.data) {
                    this.profile = res.data;
                    this.profile.email = this.authService.user?.email;
                } else {
                    // profile not found -> use mocked user object
                    this.profile = null;
                }
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error fetching profile', err);
                this.profile = null;
                if (err.error && err.error.message) {
                    this.toast.error('Error',err.error.message, 0);
                } else {
                    this.toast.error('Error','An error occurred while fetching profile', 0);
                }
            }
        });
    }

    onProfileSaved(updated: any) {
        // reload profile from API to get latest state
        this.loadProfile();
    }

    onAddressAdded(updatedProfile: any) {
        this.loadProfile();
    }

}
