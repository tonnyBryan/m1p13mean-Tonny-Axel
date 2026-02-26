import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import {CommonModule} from "@angular/common";

interface Breadcrumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-breadcrumb',
  imports: [
    RouterModule,
    CommonModule
  ],
  templateUrl: './page-breadcrumb.component.html',
  styles: ``
})
export class PageBreadcrumbComponent {
  @Input() pageTitle = '';

  // Optional: pass full breadcrumb list [{label, link?}, ...]
  @Input() breadcrumbs?: Breadcrumb[];

  // Optional: override Home label/link
  @Input() homeLabel = 'Home';
  @Input() homeLink = '/';

  get computedBreadcrumbs(): Breadcrumb[] {
    if (this.breadcrumbs && this.breadcrumbs.length) {
      return this.breadcrumbs;
    }

    const crumbs: Breadcrumb[] = [];
    crumbs.push({ label: this.homeLabel, link: this.homeLink });
    if (this.pageTitle) {
      crumbs.push({ label: this.pageTitle });
    }
    return crumbs;
  }
}
