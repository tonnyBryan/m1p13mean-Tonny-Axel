import { Component, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {DocsOverviewComponent} from "./docs-overview/docs-overview.component";
import {DocsRolesComponent} from "./docs-roles/docs-roles.component";
import {DocsRoutesComponent} from "./docs-routes/docs-routes.component";
import {DocsMongodbComponent} from "./docs-mongodb/docs-mongodb.component";
import {DocsAuthComponent} from "./docs-auth/docs-auth.component";
import {DocsSecurityComponent} from "./docs-security/docs-security.component";


export interface NavSection {
  id: string; icon: string; label: string; sublabel: string;
}

@Component({
  selector: 'app-docs-page',
  standalone: true,
  imports: [CommonModule, RouterModule, DocsOverviewComponent, DocsRolesComponent, DocsRoutesComponent, DocsMongodbComponent, DocsAuthComponent, DocsSecurityComponent],
  templateUrl: './docs-page.component.html',
  styleUrl: './docs-page.component.css',
})
export class DocsPageComponent implements AfterViewInit, OnDestroy {

  activeSection = 'overview';
  mobileNavOpen = false;

  readonly sections: NavSection[] = [
    { id: 'overview', icon: '⚡', label: 'Vue globale',    sublabel: 'Stack & Architecture'   },
    { id: 'roles',    icon: '👥', label: 'Rôles & Accès',  sublabel: '4 profils utilisateurs'  },
    { id: 'routes',   icon: '🛣️',  label: 'Routes Angular', sublabel: 'Navigation & Guards'     },
    { id: 'mongodb',  icon: '🗄️',  label: 'Schéma MongoDB', sublabel: '20 collections'          },
    { id: 'auth',     icon: '🔐', label: 'Flux Auth',       sublabel: 'JWT + OAuth + Refresh'   },
    { id: 'security', icon: '🛡️',  label: 'Sécurité & API',  sublabel: 'Erreurs, env, sécurité'  },
  ];

  private observer!: IntersectionObserver;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
        (entries) => { entries.forEach(e => { if (e.isIntersecting) this.activeSection = e.target.id; }); },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    this.sections.forEach(s => { const el = document.getElementById(s.id); if (el) this.observer.observe(el); });
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  scrollTo(id: string): void {
    this.activeSection = id;
    this.mobileNavOpen = false;
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 88, behavior: 'smooth' });
  }

  get activeSectionLabel(): string {
    return this.sections.find(s => s.id === this.activeSection)?.label ?? '';
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(e: Event): void {
    if (this.mobileNavOpen && !(e.target as HTMLElement).closest('.mobile-nav-wrapper')) this.mobileNavOpen = false;
  }
}