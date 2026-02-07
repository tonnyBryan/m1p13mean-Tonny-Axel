import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeToggleTwoComponent } from '../../../components/common/theme-toggle-two/theme-toggle-two.component';

@Component({
    selector: 'app-auth-page-layout-admin',
    imports: [
        RouterModule,
        ThemeToggleTwoComponent,
    ],
    templateUrl: './auth-page-layout-admin.component.html',
    styles: ``
})
export class AuthPageLayoutAdminComponent {

}
