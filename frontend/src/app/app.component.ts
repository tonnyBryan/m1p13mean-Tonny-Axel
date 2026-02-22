import { Component } from '@angular/core';
import {NavigationEnd, Router, RouterModule, RouterOutlet} from '@angular/router';
import { ToastContainerComponent } from "./shared/components/common/toast-container/toast-container.component";
import { trigger, transition, style, animate, query } from '@angular/animations';
import {filter} from "rxjs";
import {LogoutOverlayComponent} from "./shared/components/logout-overlay/logout-overlay.component";

export const routeFadeAnimation = trigger('routeAnimation', [
    transition('* <=> *', [
        query(':enter', [
            style({ opacity: 0, transform: 'translateY(10px)' }),
            animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ], { optional: true }),
        query(':leave', [
            animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-6px)' }))
        ], { optional: true })
    ])
]);

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, RouterOutlet, ToastContainerComponent, LogoutOverlayComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    animations: [routeFadeAnimation],
})
export class AppComponent {
    title = 'Angular Ecommerce Dashboard | TailAdmin';

    constructor(private router: Router) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
    }

    getRouteState(outlet: RouterOutlet): string {
        return outlet.activatedRouteData?.['animation'] ?? '';
    }
}