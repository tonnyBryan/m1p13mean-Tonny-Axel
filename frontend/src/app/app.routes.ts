import { Routes } from '@angular/router';
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
import { FicheBoutiqueComponent } from "./pages/boutique/fiche-boutique/fiche-boutique.component";
import { BoutiqueFicheUserComponent } from "./pages/user/boutique-fiche-user/boutique-fiche-user.component";
import { ProductFicheUserComponent } from "./pages/user/product-fiche-user/product-fiche-user.component";
import { CartUserComponent } from "./pages/user/cart-user/cart-user.component";
import { CheckoutUserComponent } from "./pages/user/checkout-user/checkout-user.component";
import { VerifyEmailComponent } from "./pages/user/verify-email/verify-email.component";
import { OrdersUserComponent } from "./pages/user/orders-user/orders-user.component";
import { OrderDetailComponent } from "./pages/user/order-detail/order-detail.component";
import { OrdersListBoutiqueComponent } from "./pages/boutique/orders-list-boutique/orders-list-boutique.component";
import { OrderDetailBoutiqueComponent } from "./pages/boutique/order-detail-boutique/order-detail-boutique.component";
import { WishlistUserComponent } from "./pages/user/wishlist-user/wishlist-user.component";
import { LandingPageComponent } from "./pages/public/landing-page/landing-page.component";
import { HelpPageComponent } from "./pages/public/help-page/help-page.component";
import { SupportPageComponent } from "./pages/public/support-page/support-page.component";
import { PrivacyPageComponent } from "./pages/public/privacy-page/privacy-page.component";
import { TermsPageComponent } from "./pages/public/terms-page/terms-page.component";
import { LandingLayoutComponent } from "./shared/layout/landing-layout/landing-layout.component";
import { DashboardUserComponent } from "./pages/user/dashboard-user/dashboard-user.component";
import { SubscriptionListComponent } from "./pages/admin/subscription-list/subscription-list.component";
import { SupportRequestComponent } from "./pages/admin/support-request/support-request.component";
import { MailComposeComponent } from "./pages/admin/mail-compose/mail-compose.component";
import { DashboardBoutiqueComponent } from "./pages/boutique/dashboard-boutique/dashboard-boutique.component";
import { ForgotPasswordComponent } from './pages/auth-pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/auth-pages/reset-password/reset-password.component';
import { SecurityBoutiqueComponent } from './pages/boutique/security-boutique/security-boutique.component';
import { StoreRegisterComponent } from './pages/boutique/store-register/store-register.component';
import { SecurityComponent } from './pages/user/security/security.component';
import {BoutiquesMapComponent} from "./pages/user/boutiques-map/boutiques-map.component";
import {unsavedChangesGuard} from "./shared/guards/unsaved-changes.guard";

const appName = environment.plateformeName || 'Shopticus';

export const routes: Routes = [
  {
    path: '',
    component: LandingLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: LandingPageComponent,
        title: appName + ' | The all-in-one shopping platform',
        data: { animation: 'home' }
      },
      {
        path: 'help',
        component: HelpPageComponent,
        title: 'Help Center | ' + appName,
        data: { animation: 'help' }
      },
      {
        path: 'support',
        component: SupportPageComponent,
        title: 'Support | ' + appName,
        data: { animation: 'support' }
      },
      {
        path: 'privacy',
        component: PrivacyPageComponent,
        title: 'Privacy Policy | ' + appName,
        data: { animation: 'privacy' }
      },
      {
        path: 'terms',
        component: TermsPageComponent,
        title: 'Terms of Service | ' + appName,
        data: { animation: 'terms' }
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        title: 'Forgot Password | ' + appName,
        data: { animation: 'forgot-password' }
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        title: 'Reset Password | ' + appName,
        data: { animation: 'reset-password' }
      },
      {
        path: 'store/register',
        component: StoreRegisterComponent,
        canDeactivate: [unsavedChangesGuard],
        title: 'Register | ' + appName,
        data: { animation: 'reset-password' }
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
        path: 'dashboard',
        component: DashboardUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Dashboard | ' + appName,
      },
      {
        path: 'stores',
        component: BoutiqueListeUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Stores | ' + appName,
      },
      {
        path: 'orders',
        component: OrdersUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'My Orders | ' + appName,
      },
      {
        path: 'maps',
        component: BoutiquesMapComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Maps | ' + appName,
      },
      {
        path: 'wishlist',
        component: WishlistUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'My Wishlist | ' + appName,
      },
      {
        path: 'orders/:id',
        component: OrderDetailComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Order Details | ' + appName
      },
      {
        path: 'stores/:id',
        component: BoutiqueFicheUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Store | ' + appName,
      },
      {
        path: 'profile',
        component: ProfileUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Profile | ' + appName
      },
      {
        path: 'profile/security',
        component: SecurityComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Security | ' + appName
      },
      {
        path: 'stores/:idStore/products/:idProduct',
        component: ProductFicheUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Product | ' + appName
      },
      {
        path: 'cart',
        component: CartUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Cart | ' + appName
      },
      {
        path: 'cart/checkout',
        component: CheckoutUserComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Checkout | ' + appName
      },
      {
        path: 'verify-email',
        component: VerifyEmailComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Verify Email | ' + appName
      },
    ]
  },
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Sign In | ' + appName
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Sign Up | ' + appName
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
    title: 'Admin Sign In | ' + appName
  },
  {
    path: 'admin/app',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'boutiques',
        pathMatch: 'full'
      },
      {
        path: 'subscriptions',
        component: SubscriptionListComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Subscriptions | ' + appName,
      },
      {
        path: 'support-requests',
        component: SupportRequestComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Support Requests | ' + appName,
      },
      {
        path: 'support-requests/:id/reply',
        component: MailComposeComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
      },
      {
        path: 'boutiques',
        component: BoutiqueListComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Boutiques | ' + appName,
      },
      {
        path: 'boutiques/add',
        component: AddBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Add Boutique | ' + appName,
      },
      {
        path: 'boutiques/:id',
        loadComponent: () => import('./pages/admin/boutique-list/boutique-detail/boutique-detail.component').then(m => m.BoutiqueDetailComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Boutique Details | ' + appName,
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/user-management/users-list/users-list.component').then(m => m.UsersListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Users | ' + appName,
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./pages/admin/user-management/user-detail/user-detail.component').then(m => m.UserDetailComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'User Details | ' + appName,
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
    title: 'Boutique Sign In | ' + appName
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
        component: DashboardBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Boutique Dashboard | ' + appName,
      },

      {
        path: 'orders',
        component: OrdersListBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Orders | ' + appName,
      },
      {
        path: 'orders/:id',
        component: OrderDetailBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Order Details | ' + appName
      },
      {
        path: 'products',
        component: ProductListBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Products | ' + appName,
      },
      {
        path: 'products/add',
        component: AddProductBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Add Product | ' + appName,
      },
      {
        path: 'products/:id',
        component: ProductFicheBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Product Details | ' + appName,
      },
      {
        path: 'profile',
        component: FicheBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Boutique Profile | ' + appName,
      },
      {
        path: 'profile/security',
        component: SecurityBoutiqueComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Boutique Security | ' + appName,
      },
      {
        path: 'vente-liste/add',
        loadComponent: () => import('./pages/boutique/vente-directe/vente-directe.component').then(m => m.VenteDirecteComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Direct Sale | ' + appName
      },
      {
        path: 'vente-liste/edit/:id',
        loadComponent: () => import('./pages/boutique/vente-directe/vente-directe.component').then(m => m.VenteDirecteComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Edit Direct Sale | ' + appName
      },
      {
        path: 'vente-liste',
        loadComponent: () => import('./pages/boutique/vente-list/vente-list.component').then(m => m.VenteListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Sales History | ' + appName
      },
      {
        path: 'vente-liste/:id',
        loadComponent: () => import('./pages/boutique/vente-detail/vente-detail.component').then(m => m.VenteDetailComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Sale Details | ' + appName
      },
      {
        path: 'stock/mouvements',
        loadComponent: () => import('./pages/boutique/stock/stock-mouvements-list/stock-mouvements-list.component').then(m => m.StockMouvementsListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Stock Movements | ' + appName
      },
      {
        path: 'stock/mouvements/add',
        loadComponent: () => import('./pages/boutique/stock/stock-mouvement-form/stock-mouvement-form.component').then(m => m.StockMouvementFormComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'New Stock Movement | ' + appName
      },
      {
        path: 'stock/inventaire',
        loadComponent: () => import('./pages/boutique/stock/inventory-list/inventory-list.component').then(m => m.InventoryListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Inventory Counts | ' + appName
      },
      {
        path: 'stock/inventaire/add',
        loadComponent: () => import('./pages/boutique/stock/inventory-form/inventory-form.component').then(m => m.InventoryFormComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'New Inventory Count | ' + appName
      },
    ]
  },



  // error pages
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page Not Found | ' + appName
  },
];
