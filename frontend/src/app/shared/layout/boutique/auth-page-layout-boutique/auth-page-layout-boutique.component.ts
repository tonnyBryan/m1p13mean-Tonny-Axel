import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeToggleTwoComponent } from '../../../components/common/theme-toggle-two/theme-toggle-two.component';
import { environment } from '../../../../../environments/environment';


@Component({
    selector: 'app-auth-page-layout-boutique',
    imports: [
        RouterModule,
        ThemeToggleTwoComponent,
    ],
    templateUrl: './auth-page-layout-boutique.component.html',
    styles: ``
})
export class AuthPageLayoutBoutiqueComponent {
    appName = environment.plateformeName;
}
