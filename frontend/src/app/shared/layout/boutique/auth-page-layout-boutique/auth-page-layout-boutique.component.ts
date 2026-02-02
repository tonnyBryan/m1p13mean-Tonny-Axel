import { Component } from '@angular/core';
import { GridShapeComponent } from '../../../components/common/grid-shape/grid-shape.component';
import { RouterModule } from '@angular/router';
import { ThemeToggleTwoComponent } from '../../../components/common/theme-toggle-two/theme-toggle-two.component';

@Component({
    selector: 'app-auth-page-layout-boutique',
    imports: [
        GridShapeComponent,
        RouterModule,
        ThemeToggleTwoComponent,
    ],
    templateUrl: './auth-page-layout-boutique.component.html',
    styles: ``
})
export class AuthPageLayoutBoutiqueComponent {

}
