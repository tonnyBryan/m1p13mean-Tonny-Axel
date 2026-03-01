import { Routes } from '@angular/router';
import { AuthGuard } from "./shared/guards/auth.guard";
import { RoleGuard } from "./shared/guards/role.guard";
import { environment } from '../environments/environment';
import { unsavedChangesGuard } from "./shared/guards/unsaved-changes.guard";

const appName = environment.plateformeName || 'Shopticus';

export const routes: Routes = [
  // ─── PUBLIC LAYOUT ───────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./shared/layout/landing-layout/landing-layout.component').then(m => m.LandingLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/public/landing-page/landing-page.component').then(m => m.LandingPageComponent),
        title: appName + ' | The all-in-one shopping platform',
        data: { animation: 'home' }
      },
      {
        path: 'help',
        loadComponent: () => import('./pages/public/help-page/help-page.component').then(m => m.HelpPageComponent),
        title: 'Help Center | ' + appName,
        data: { animation: 'help' }
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/public/support-page/support-page.component').then(m => m.SupportPageComponent),
        title: 'Support | ' + appName,
        data: { animation: 'support' }
      },
      {
        path: 'privacy',
        loadComponent: () => import('./pages/public/privacy-page/privacy-page.component').then(m => m.PrivacyPageComponent),
        title: 'Privacy Policy | ' + appName,
        data: { animation: 'privacy' }
      },
      {
        path: 'terms',
        loadComponent: () => import('./pages/public/terms-page/terms-page.component').then(m => m.TermsPageComponent),
        title: 'Terms of Service | ' + appName,
        data: { animation: 'terms' }
      },
      {
        path: 'discover',
        loadComponent: () => import('./pages/public/discover-page/discover-page.component').then(m => m.DiscoverPageComponent),
        title: 'Explore Stores | ' + appName,
        data: { animation: 'discover' }
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/auth-pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Forgot Password | ' + appName,
        data: { animation: 'forgot-password' }
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/auth-pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'Reset Password | ' + appName,
        data: { animation: 'reset-password' }
      },
      {
        path: 'store/register',
        loadComponent: () => import('./pages/boutique/store-register/store-register.component').then(m => m.StoreRegisterComponent),
        canDeactivate: [unsavedChangesGuard],
        title: 'Register | ' + appName,
        data: { animation: 'reset-password' }
      },
    ]
  },

  // ─── USER APP ─────────────────────────────────────────────────────────────────
  {
    path: 'v1',
    loadComponent: () => import('./shared/layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'stores',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/user/dashboard-user/dashboard-user.component').then(m => m.DashboardUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Dashboard | ' + appName,
      },
      {
        path: 'stores',
        loadComponent: () => import('./pages/user/boutique-liste-user/boutique-liste-user.component').then(m => m.BoutiqueListeUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Stores | ' + appName,
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/user/orders-user/orders-user.component').then(m => m.OrdersUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'My Orders | ' + appName,
      },
      {
        path: 'maps',
        loadComponent: () => import('./pages/user/boutiques-map/boutiques-map.component').then(m => m.BoutiquesMapComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Maps | ' + appName,
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./pages/user/wishlist-user/wishlist-user.component').then(m => m.WishlistUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'My Wishlist | ' + appName,
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/user/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Order Details | ' + appName
      },
      {
        path: 'stores/:id',
        loadComponent: () => import('./pages/user/boutique-fiche-user/boutique-fiche-user.component').then(m => m.BoutiqueFicheUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        pathMatch: 'full',
        title: 'Store | ' + appName,
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/user/profile-user/profile-user.component').then(m => m.ProfileUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Profile | ' + appName
      },
      {
        path: 'profile/security',
        loadComponent: () => import('./pages/user/security/security.component').then(m => m.SecurityComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Security | ' + appName
      },
      {
        path: 'stores/:idStore/products/:idProduct',
        loadComponent: () => import('./pages/user/product-fiche-user/product-fiche-user.component').then(m => m.ProductFicheUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Product | ' + appName
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/user/cart-user/cart-user.component').then(m => m.CartUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Cart | ' + appName
      },
      {
        path: 'cart/checkout',
        loadComponent: () => import('./pages/user/checkout-user/checkout-user.component').then(m => m.CheckoutUserComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Checkout | ' + appName
      },
      {
        path: 'verify-email',
        loadComponent: () => import('./pages/user/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.userRole] },
        title: 'Verify Email | ' + appName
      },
    ]
  },

  // ─── AUTH PAGES ───────────────────────────────────────────────────────────────
  {
    path: 'signin',
    loadComponent: () => import('./pages/auth-pages/sign-in/sign-in.component').then(m => m.SignInComponent),
    title: 'Sign In | ' + appName
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/auth-pages/sign-up/sign-up.component').then(m => m.SignUpComponent),
    title: 'Sign Up | ' + appName
  },
  {
    path: 'oauth/callback',
    loadComponent: () => import('./pages/auth-pages/oauth-callback/oauth-callback.component').then(m => m.OauthCallbackComponent),
    title: 'Signing In | ' + appName
  },

  // ─── ADMIN ────────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    redirectTo: 'admin/signin',
    pathMatch: 'full'
  },
  {
    path: 'admin/signin',
    loadComponent: () => import('./pages/admin/auth-pages-admin/sign-in-admin/sign-in-admin.component').then(m => m.SignInAdminComponent),
    title: 'Admin Sign In | ' + appName
  },
  {
    path: 'admin/app',
    loadComponent: () => import('./shared/layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'boutiques',
        pathMatch: 'full'
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./pages/admin/subscription-list/subscription-list.component').then(m => m.SubscriptionListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Subscriptions | ' + appName,
      },
      {
        path: 'support-requests',
        loadComponent: () => import('./pages/admin/support-request/support-request.component').then(m => m.SupportRequestComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Support Requests | ' + appName,
      },
      {
        path: 'support-requests/:id/reply',
        loadComponent: () => import('./pages/admin/mail-compose/mail-compose.component').then(m => m.MailComposeComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
      },
      {
        path: 'boutiques',
        loadComponent: () => import('./pages/admin/boutique-list/boutique-list.component').then(m => m.BoutiqueListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Boutiques | ' + appName,
      },
      {
        path: 'boutiques/add',
        loadComponent: () => import('./pages/admin/boutique-list/add-boutique/add-boutique.component').then(m => m.AddBoutiqueComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Add Boutique | ' + appName,
      },
      {
        path: 'boxes',
        loadComponent: () => import('./pages/admin/box-list/box-list.component').then(m => m.BoxListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.adminRole] },
        pathMatch: 'full',
        title: 'Box | ' + appName,
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

  // ─── BOUTIQUE ─────────────────────────────────────────────────────────────────
  {
    path: 'store',
    redirectTo: 'store/signin',
    pathMatch: 'full'
  },
  {
    path: 'store/signin',
    loadComponent: () => import('./pages/boutique/auth-pages-boutique/sign-in-boutique/sign-in-boutique.component').then(m => m.SignInBoutiqueComponent),
    title: 'Boutique Sign In | ' + appName
  },
  {
    path: 'store/app',
    loadComponent: () => import('./shared/layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/boutique/dashboard-boutique/dashboard-boutique.component').then(m => m.DashboardBoutiqueComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Boutique Dashboard | ' + appName,
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/boutique/orders-list-boutique/orders-list-boutique.component').then(m => m.OrdersListBoutiqueComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Orders | ' + appName,
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/boutique/order-detail-boutique/order-detail-boutique.component').then(m => m.OrderDetailBoutiqueComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Order Details | ' + appName
      },
      {
        path: 'chat',
        loadComponent: () => import('./shared/components/chatbot/chat-page/chat-page.component').then(m => m.ChatPageComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Chat | ' + appName,
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/boutique/product-list-boutique/product-list-boutique.component').then(m => m.ProductListBoutiqueComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Products | ' + appName,
      },
      {
        path: 'products/add',
        loadComponent: () => import('./pages/boutique/add-product-boutique/add-product-boutique.component').then(m => m.AddProductBoutiqueComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Add Product | ' + appName,
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./pages/boutique/product-fiche-boutique/product-fiche-boutique.component').then(m => m.ProductFicheBoutiqueComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Product Details | ' + appName,
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/boutique/fiche-boutique/fiche-boutique.component').then(m => m.FicheBoutiqueComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        pathMatch: 'full',
        title: 'Boutique Profile | ' + appName,
      },
      {
        path: 'profile/security',
        loadComponent: () => import('./pages/boutique/security-boutique/security-boutique.component').then(m => m.SecurityBoutiqueComponent),
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
      {
        path: 'stock/inventaire/:id',
        loadComponent: () => import('./pages/boutique/stock/inventory-detail/inventory-detail.component').then(m => m.InventoryDetailComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [environment.boutiqueRole] },
        title: 'Inventory Detail | ' + appName
      },
    ]
  },

  // ─── ERROR PAGES ──────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () => import('./pages/other-page/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found | ' + appName
  },
];
