import { Component } from '@angular/core';
import {
    AuthPageLayoutAdminComponent
} from "../../../../shared/layout/admin/auth-page-layout-admin/auth-page-layout-admin.component";
import {
    SigninFormAdminComponent
} from "../../../../shared/components/auth/signin-form-admin/signin-form-admin.component";

@Component({
    selector: 'app-sign-in-admin',
    imports: [
        AuthPageLayoutAdminComponent,
        SigninFormAdminComponent,
    ],
    templateUrl: './sign-in-admin.component.html',
    styles: ``
})
export class SignInAdminComponent {

}
