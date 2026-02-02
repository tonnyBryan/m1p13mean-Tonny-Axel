import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import {AuthGuard} from "./shared/guards/auth.guard";
import {SignInAdminComponent} from "./pages/admin/auth-pages-admin/sign-in-admin/sign-in-admin.component";
import {RoleGuard} from "./shared/guards/role.guard";
import { environment } from '../environments/environment';
import {
  SignInBoutiqueComponent
} from "./pages/boutique/auth-pages-boutique/sign-in-boutique/sign-in-boutique.component";


export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    children:[
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: EcommerceComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path:'profile',
        component:ProfileComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole, environment.userRole, environment.boutiqueRole] },
        title:'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path:'blank',
        component:BlankComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole, environment.userRole, environment.boutiqueRole] },
        title:'Angular Blank Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Angular Sign In Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path:'signup',
    component:SignUpComponent,
    title:'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  // ADMIN
  {
    path:'admin',
    redirectTo: 'admin/signin',
    pathMatch: 'full'
  },
  {
    path:'admin/signin',
    component:SignInAdminComponent,
    title:'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path:'admin/app',
    component:AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: EcommerceComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title:
            'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
    ]
  },



  // BOUTIQUE
  {
    path:'store',
    redirectTo: 'store/signin',
    pathMatch: 'full'
  },
  {
    path:'store/signin',
    component:SignInBoutiqueComponent,
    title:'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path:'store/app',
    component:AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: EcommerceComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title:
            'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
    ]
  },



  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
