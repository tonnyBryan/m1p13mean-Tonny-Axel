import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { AuthGuard } from "./shared/guards/auth.guard";
import { SignInAdminComponent } from "./pages/admin/auth-pages-admin/sign-in-admin/sign-in-admin.component";
import { RoleGuard } from "./shared/guards/role.guard";
import { environment } from '../environments/environment';
import {
  SignInBoutiqueComponent
} from "./pages/boutique/auth-pages-boutique/sign-in-boutique/sign-in-boutique.component";
import { ProductListBoutiqueComponent } from "./pages/boutique/product-list-boutique/product-list-boutique.component";
import { AddProductBoutiqueComponent } from "./pages/boutique/add-product-boutique/add-product-boutique.component";
import { BoutiqueListComponent } from "./pages/admin/boutique-list/boutique-list.component";
import { AddBoutiqueComponent } from "./pages/admin/boutique-list/add-boutique/add-boutique.component";
import { ProductFicheBoutiqueComponent } from "./pages/boutique/product-fiche-boutique/product-fiche-boutique.component";
import { BoutiqueListeUserComponent } from "./pages/user/boutique-liste-user/boutique-liste-user.component";
import { ProfileUserComponent } from "./pages/user/profile-user/profile-user.component";
import {FicheBoutiqueComponent} from "./pages/boutique/fiche-boutique/fiche-boutique.component";
import {BoutiqueFicheUserComponent} from "./pages/user/boutique-fiche-user/boutique-fiche-user.component";
import {ProductFicheUserComponent} from "./pages/user/product-fiche-user/product-fiche-user.component";


export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
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
        data: { roles: [environment.userRole, environment.boutiqueRole, environment.adminRole] },
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole, environment.userRole, environment.boutiqueRole] },
        title: 'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
    ]
  },
  {
    path: 'v1',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'stores',
        pathMatch: 'full'
      },
      {
        path: 'stores',
        component: BoutiqueListeUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'stores/:id',
        component: BoutiqueFicheUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title:
            'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'profile',
        component: ProfileUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
      {
        path: 'stores/:idStore/products/:idProduct',
        component: ProductFicheUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Angular Profile Dashboard | TailAdmin - Angular Admin Dashboard Template'
      },
    ]
  },
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Angular Sign In Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  // ADMIN
  {
    path: 'admin',
    redirectTo: 'admin/signin',
    pathMatch: 'full'
  },
  {
    path: 'admin/signin',
    component: SignInAdminComponent,
    title: 'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path: 'admin/app',
    component: AppLayoutComponent,
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
      {
        path: 'boutiques',
        component: BoutiqueListComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title:
          'Shop Management | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'boutiques/add',
        component: AddBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title:
          'Add New Boutique | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'boutiques/:id',
        loadComponent: () => import('./pages/admin/boutique-list/boutique-detail/boutique-detail.component').then(m => m.BoutiqueDetailComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title:
          'Boutique Details | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/user-management/users-list/users-list.component').then(m => m.UsersListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title:
          'User Management | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./pages/admin/user-management/user-detail/user-detail.component').then(m => m.UserDetailComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title:
          'User Details | TailAdmin - Angular Admin Dashboard Template',
      },
    ]
  },



  // BOUTIQUE
  {
    path: 'store',
    redirectTo: 'store/signin',
    pathMatch: 'full'
  },
  {
    path: 'store/signin',
    component: SignInBoutiqueComponent,
    title: 'Angular Sign Up Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
  {
    path: 'store/app',
    component: AppLayoutComponent,
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
      {
        path: 'products',
        component: ProductListBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'products/add',
        component: AddProductBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'products/:id',
        component: ProductFicheBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | TailAdmin - Angular Admin Dashboard Template',
      },
      {
        path: 'profile',
        component: FicheBoutiqueComponent,
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
    path: '**',
    component: NotFoundComponent,
    title: 'Angular NotFound Dashboard | TailAdmin - Angular Admin Dashboard Template'
  },
];
