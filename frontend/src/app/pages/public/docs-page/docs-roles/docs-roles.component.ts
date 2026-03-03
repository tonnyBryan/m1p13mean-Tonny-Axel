import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  label: string;
}

interface RoleCard {
  id: string;
  icon: string;
  name: string;
  desc: string;
  color: string;
  bgCls: string;
  borderCls: string;
  textCls: string;
  badgeCls: string;
  access: string;
  inscription: string;
  features: Feature[];
}

@Component({
  selector: 'app-docs-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-roles.component.html',
})
export class DocsRolesComponent {

  activeRole = 'guest';

  readonly roles: RoleCard[] = [
    {
      id: 'guest',
      icon: '👤',
      name: 'Guest',
      desc: 'Visiteur non connecté',
      color: '#6b7280',
      bgCls:     'bg-gray-50 dark:bg-gray-800/40',
      borderCls: 'border-gray-200 dark:border-gray-700',
      textCls:   'text-gray-700 dark:text-gray-300',
      badgeCls:  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
      access: 'Aucune authentification requise',
      inscription: 'Accès direct — pas de compte nécessaire',
      features: [
        { icon: '🏠', label: 'Landing page & présentation de la plateforme' },
        { icon: '🔍', label: 'Page /discover — explorer les stores et produits' },
        { icon: '📝', label: 'Inscription (signup) en tant que user' },
        { icon: '🔐', label: 'Connexion (signin)' },
        { icon: '🔑', label: 'Réinitialisation de mot de passe' },
        { icon: '📄', label: 'Pages statiques : Help, Support, Privacy, Terms' },
        { icon: '🏪', label: 'Inscription boutique — /store/register (formulaire + validation admin)' },
        { icon: '📰', label: 'Magazines & actualités' },
      ],
    },
    {
      id: 'user',
      icon: '🛍️',
      name: 'User',
      desc: 'Client de la plateforme',
      color: '#465fff',
      bgCls:     'bg-brand-50 dark:bg-brand-900/20',
      borderCls: 'border-brand-200 dark:border-brand-800',
      textCls:   'text-brand-700 dark:text-brand-300',
      badgeCls:  'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400',
      access: 'AuthGuard + RoleGuard · role: user',
      inscription: 'Signup → Vérification email → Accès complet',
      features: [
        { icon: '🏪', label: 'Marketplace — liste de tous les stores validés' },
        { icon: '🗺️', label: 'Carte interactive des boutiques (maps)' },
        { icon: '📦', label: 'Fiche produit — détails, images, avis, prix' },
        { icon: '🛒', label: 'Panier & checkout avec choix livraison/retrait' },
        { icon: '📋', label: 'Mes commandes — suivi et détail par commande' },
        { icon: '❤️', label: 'Wishlist — produits sauvegardés' },
        { icon: '⭐', label: 'Notation et avis sur les produits' },
        { icon: '👤', label: 'Profil — infos personnelles, adresses, carte' },
        { icon: '🔒', label: 'Sécurité — sessions actives, changement mot de passe' },
        { icon: '🖥️', label: 'Alerte nouvelle connexion depuis un appareil inconnu' },
        { icon: '🔔', label: 'Notifications en temps réel' },
      ],
    },
    {
      id: 'boutique',
      icon: '🏪',
      name: 'Boutique',
      desc: 'Propriétaire de store',
      color: '#10b981',
      bgCls:     'bg-emerald-50 dark:bg-emerald-900/20',
      borderCls: 'border-emerald-200 dark:border-emerald-800',
      textCls:   'text-emerald-700 dark:text-emerald-300',
      badgeCls:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      access: 'AuthGuard + RoleGuard · role: boutique',
      inscription: '/store/register → Validation par Admin → Accès dashboard',
      features: [
        { icon: '📊', label: 'Dashboard — statistiques ventes, commandes, stock' },
        { icon: '📦', label: 'Gestion produits — CRUD, images, prix, stock' },
        { icon: '🗂️', label: 'Catégories personnalisées par boutique' },
        { icon: '📋', label: 'Commandes online — accepter, livrer, annuler' },
        { icon: '💰', label: 'Ventes directes (caisse) — clients de passage' },
        { icon: '📈', label: 'Historique des ventes et statistiques' },
        { icon: '📦', label: 'Mouvements de stock (IN/OUT) manuels' },
        { icon: '🗃️', label: 'Inventaire — comptage et régularisation' },
        { icon: '🚚', label: 'Configuration livraison — zones, prix/km, horaires' },
        { icon: '🏪', label: 'Profil boutique — logo, description, coordonnées' },
        { icon: '🔒', label: 'Sécurité — sessions actives, mot de passe' },
        { icon: '🤖', label: 'Assistant IA (chatbot intégré)' },
        { icon: '🔔', label: 'Notifications — commandes, stock bas, ventes' },
        { icon: '📰', label: 'Gestion magazine' },
        { icon: '✍️', label: 'Création de publication' },
      ],
    },
    {
      id: 'admin',
      icon: '⚙️',
      name: 'Admin',
      desc: 'Administrateur plateforme',
      color: '#ef4444',
      bgCls:     'bg-red-50 dark:bg-red-900/20',
      borderCls: 'border-red-200 dark:border-red-800',
      textCls:   'text-red-700 dark:text-red-300',
      badgeCls:  'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      access: 'AuthGuard + RoleGuard · role: admin',
      inscription: 'Compte créé directement en base de données',
      features: [
        { icon: '🏪', label: 'Gestion boutiques — liste, validation, détail' },
        { icon: '✅', label: 'Validation des nouvelles boutiques (isValidated)' },
        { icon: '➕', label: 'Création manuelle de boutiques' },
        { icon: '📦', label: 'Gestion des boxes du centre commercial' },
        { icon: '👥', label: 'Gestion des utilisateurs — liste et détail' },
        { icon: '📧', label: 'Abonnements newsletter — liste des inscrits' },
        { icon: '🎫', label: 'Tickets support — lecture et réponse par email' },
        { icon: '💳', label: 'Paiements loyer — suivi des abonnements des boutiques' },
        { icon: '📊', label: 'Dashboard admin — vue globale de la plateforme' },
        { icon: '📰', label: 'Gestion magazine' },
        { icon: '✍️', label: 'Création de publication' },
      ],
    },
  ];

  get activeRoleData(): RoleCard {
    return this.roles.find(r => r.id === this.activeRole)!;
  }

  selectRole(id: string): void {
    this.activeRole = id;
  }
}