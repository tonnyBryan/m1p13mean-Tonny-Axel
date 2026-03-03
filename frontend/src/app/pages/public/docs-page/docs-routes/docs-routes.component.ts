import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Route {
  path: string;
  title: string;
  guard: string;
  guardCls: string;
}

interface RouteGroup {
  id: string;
  icon: string;
  name: string;
  desc: string;
  bgCls: string;
  borderCls: string;
  textCls: string;
  badgeCls: string;
  routes: Route[];
}

@Component({
  selector: 'app-docs-routes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-routes.component.html',
})
export class DocsRoutesComponent {

  activeGroup = 'public';

  readonly groups: RouteGroup[] = [
    {
      id: 'public',
      icon: '🌐',
      name: 'Public',
      desc: 'Landing layout · Accessible à tous',
      bgCls:     'bg-gray-50 dark:bg-gray-800/40',
      borderCls: 'border-gray-200 dark:border-gray-700',
      textCls:   'text-gray-700 dark:text-gray-300',
      badgeCls:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      routes: [
        { path: '/home',             title: 'Landing Page',              guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/discover',         title: 'Explorer les stores',       guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/help',             title: 'Centre d\'aide',            guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/support',          title: 'Contact & Support',         guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/privacy',          title: 'Politique de confidentialité', guard: 'Aucun',                    guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/terms',            title: 'Conditions d\'utilisation', guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/signin',           title: 'Connexion User',            guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/signup',           title: 'Inscription User',          guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/forgot-password',  title: 'Mot de passe oublié',       guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/reset-password',   title: 'Réinitialiser mot de passe',guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/oauth/callback',   title: 'Callback Google OAuth',     guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/store/register',   title: 'Inscription boutique',      guard: 'unsavedChangesGuard',         guardCls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
        { path: '/docs',             title: 'Documentation technique',   guard: 'Aucun',                       guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
      ],
    },
    {
      id: 'user',
      icon: '🛍️',
      name: 'User App',
      desc: '/v1/... · AuthGuard + RoleGuard (user)',
      bgCls:     'bg-brand-50 dark:bg-brand-900/20',
      borderCls: 'border-brand-200 dark:border-brand-800',
      textCls:   'text-brand-700 dark:text-brand-300',
      badgeCls:  'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
      routes: [
        { path: '/v1/stores',                          title: 'Marketplace — liste des stores',      guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/stores/:id',                      title: 'Fiche d\'une boutique',              guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/stores/:idStore/products/:id',    title: 'Fiche produit',                      guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/maps',                            title: 'Carte interactive des boutiques',    guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/cart',                            title: 'Panier',                             guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/cart/checkout',                   title: 'Checkout — finaliser la commande',   guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/orders',                          title: 'Mes commandes',                      guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/orders/:id',                      title: 'Détail d\'une commande',             guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/wishlist',                        title: 'Ma wishlist',                        guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/dashboard',                       title: 'Dashboard utilisateur',              guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/profile',                         title: 'Mon profil',                         guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/profile/security',                title: 'Sécurité & sessions',                guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
        { path: '/v1/verify-email',                    title: 'Vérification email',                 guard: 'AuthGuard · RoleGuard', guardCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400' },
      ],
    },
    {
      id: 'boutique',
      icon: '🏪',
      name: 'Boutique',
      desc: '/store/app/... · AuthGuard + RoleGuard (boutique)',
      bgCls:     'bg-emerald-50 dark:bg-emerald-900/20',
      borderCls: 'border-emerald-200 dark:border-emerald-800',
      textCls:   'text-emerald-700 dark:text-emerald-300',
      badgeCls:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      routes: [
        { path: '/store/signin',                  title: 'Connexion boutique',             guard: 'Aucun',                   guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/store/app/dashboard',           title: 'Dashboard boutique',             guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/products',            title: 'Liste des produits',             guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/products/add',        title: 'Ajouter un produit',             guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/products/:id',        title: 'Détail d\'un produit',           guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/orders',              title: 'Commandes reçues',               guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/orders/:id',          title: 'Détail d\'une commande',         guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/vente-liste',         title: 'Historique ventes directes',     guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/vente-liste/add',     title: 'Nouvelle vente directe',         guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/vente-liste/edit/:id',title: 'Modifier une vente directe',     guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/vente-liste/:id',     title: 'Détail d\'une vente',            guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/stock/mouvements',    title: 'Mouvements de stock',            guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/stock/mouvements/add','title': 'Nouveau mouvement de stock',   guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/stock/inventaire',    title: 'Inventaires',                    guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/stock/inventaire/add',title: 'Nouvel inventaire',              guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/stock/inventaire/:id',title: 'Détail d\'un inventaire',        guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/chat',                title: 'Assistant IA (chatbot)',          guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/profile',             title: 'Profil boutique',                guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
        { path: '/store/app/profile/security',    title: 'Sécurité & sessions',            guard: 'AuthGuard · RoleGuard',   guardCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
      ],
    },
    {
      id: 'admin',
      icon: '⚙️',
      name: 'Admin',
      desc: '/admin/app/... · AuthGuard + RoleGuard (admin)',
      bgCls:     'bg-red-50 dark:bg-red-900/20',
      borderCls: 'border-red-200 dark:border-red-800',
      textCls:   'text-red-700 dark:text-red-300',
      badgeCls:  'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      routes: [
        { path: '/admin/signin',                    title: 'Connexion admin',                 guard: 'Aucun',                 guardCls: 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' },
        { path: '/admin/app/boutiques',             title: 'Liste des boutiques',             guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/boutiques/add',         title: 'Ajouter une boutique',            guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/boutiques/:id',         title: 'Détail & validation boutique',    guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/boxes',                 title: 'Gestion des boxes',               guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/users',                 title: 'Liste des utilisateurs',          guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/users/:id',             title: 'Détail utilisateur',              guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/subscriptions',         title: 'Abonnements newsletter',          guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/support-requests',      title: 'Tickets support',                 guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/support-requests/:id/reply', title: 'Répondre à un ticket',      guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/dashboard',                   title: 'Dashboard admin',               guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/rent-payments',               title: 'Paiements loyer — vue globale', guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
        { path: '/admin/app/rent-payments/list',          title: 'Historique paiements loyer',    guard: 'AuthGuard · RoleGuard', guardCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
      ],
    },
  ];

  get activeGroupData(): RouteGroup {
    return this.groups.find(g => g.id === this.activeGroup)!;
  }

  selectGroup(id: string): void {
    this.activeGroup = id;
  }
}