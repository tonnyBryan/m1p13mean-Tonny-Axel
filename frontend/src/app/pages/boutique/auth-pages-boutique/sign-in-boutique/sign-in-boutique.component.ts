import { Component } from '@angular/core';
import {
    AuthPageLayoutBoutiqueComponent
} from "../../../../shared/layout/boutique/auth-page-layout-boutique/auth-page-layout-boutique.component";
import {
    SigninFormBoutiqueComponent
} from "../../../../shared/components/auth/signin-form-boutique/signin-form-boutique.component";

@Component({
    selector: 'app-sign-in-boutique',
    imports: [
        AuthPageLayoutBoutiqueComponent,
        SigninFormBoutiqueComponent,
    ],
    templateUrl: './sign-in-boutique.component.html',
    styles: ``
})
export class SignInBoutiqueComponent {

}
