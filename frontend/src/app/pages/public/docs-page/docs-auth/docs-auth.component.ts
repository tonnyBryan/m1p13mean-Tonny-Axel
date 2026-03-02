import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FlowStep {
  icon: string;
  label: string;
  note?: string;
  type?: 'success' | 'error' | 'token' | 'email' | 'warning';
}

interface AuthFlow {
  id: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  bgCls: string;
  borderCls: string;
  textCls: string;
  steps: FlowStep[];
}

@Component({
  selector: 'app-docs-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-auth.component.html',
})
export class DocsAuthComponent {

  activeFlow = 'signup';

  readonly flows: AuthFlow[] = [
    {
      id: 'signup',
      icon: '📝', title: 'Inscription User', desc: 'Signup + vérification email OTP',
      color: '#6366f1',
      bgCls: 'bg-indigo-50 dark:bg-indigo-900/20', borderCls: 'border-indigo-200 dark:border-indigo-800', textCls: 'text-indigo-700 dark:text-indigo-300',
      steps: [
        { icon: '📋', label: 'Formulaire signup', note: 'name, email, password' },
        { icon: '📡', label: 'POST /auth/register', note: 'Création User (isEmailVerified: false)' },
        { icon: '📧', label: 'Envoi OTP via Brevo', note: 'Code 6 chiffres · TTL 10min', type: 'email' },
        { icon: '🔢', label: 'Saisie du code OTP', note: 'EmailVerification · max 5 tentatives' },
        { icon: '✅', label: 'isEmailVerified = true', type: 'success' },
        { icon: '🎟️', label: 'Access Token (15min) + Refresh Token (1j)', type: 'token' },
        { icon: '🏠', label: 'Redirect → /v1/stores ou intent URL' },
        { icon: '⚠️', label: 'Actions critiques bloquées', note: 'Panier, commande, avis… bloqués tant que isEmailVerified = false', type: 'warning' },
        { icon: '✅', label: 'Accès complet après vérification email', type: 'success' },
      ],
    },
    {
      id: 'signin',
      icon: '🔐', title: 'Connexion locale', desc: 'Email + Password · JWT',
      color: '#3b82f6',
      bgCls: 'bg-blue-50 dark:bg-blue-900/20', borderCls: 'border-blue-200 dark:border-blue-800', textCls: 'text-blue-700 dark:text-blue-300',
      steps: [
        { icon: '📋', label: 'Formulaire signin', note: 'email + password' },
        { icon: '📡', label: 'POST /auth/login', note: 'Vérification hash bcrypt' },
        { icon: '🎟️', label: 'Access Token (15min)', note: 'Stocké en mémoire', type: 'token' },
        { icon: '🔄', label: 'Refresh Token (1 jour)', note: 'Hashé en base · RefreshToken collection', type: 'token' },
        { icon: '🖥️', label: 'Session enregistrée', note: 'device, browser, OS, IP, location' },
        { icon: '🏠', label: 'Redirect → /v1/stores ou intent URL', type: 'success' },
        { icon: '⚠️', label: 'Actions critiques bloquées si email non vérifié', note: 'Panier, commande, avis… · Guard vérifie isEmailVerified', type: 'warning' },
        { icon: '✅', label: 'Accès complet après vérification email', type: 'success' },
      ],
    },
    {
      id: 'refresh',
      icon: '🔁', title: 'Auto-refresh (Interceptor)', desc: 'Renouvellement transparent du token',
      color: '#10b981',
      bgCls: 'bg-emerald-50 dark:bg-emerald-900/20', borderCls: 'border-emerald-200 dark:border-emerald-800', textCls: 'text-emerald-700 dark:text-emerald-300',
      steps: [
        { icon: '📡', label: 'Requête API avec Access Token expiré' },
        { icon: '❌', label: 'Serveur retourne 420 Token Expired', type: 'error' },
        { icon: '🛡️', label: 'HTTP Interceptor intercepte le 420', note: 'Angular interceptor' },
        { icon: '🔄', label: 'POST /auth/refresh', note: 'Envoi du Refresh Token' },
        { icon: '🎟️', label: 'Nouveau Access Token (15min)', type: 'token' },
        { icon: '🔁', label: 'Requête originale rejouée', type: 'success' },
        { icon: '✅', label: 'Réponse transparente pour l\'utilisateur', type: 'success' },
      ],
    },
    {
      id: 'oauth',
      icon: '🌐', title: 'Google OAuth', desc: 'Connexion via compte Google',
      color: '#f59e0b',
      bgCls: 'bg-amber-50 dark:bg-amber-900/20', borderCls: 'border-amber-200 dark:border-amber-800', textCls: 'text-amber-700 dark:text-amber-300',
      steps: [
        { icon: '🔵', label: 'Clic "Continuer avec Google"' },
        { icon: '↗️', label: 'Redirect → Google OAuth consent' },
        { icon: '↙️', label: 'Callback GET /oauth/callback', note: 'Code Google reçu' },
        { icon: '🔄', label: 'Échange code → profil Google', note: 'googleId, email, name' },
        { icon: '👤', label: 'User créé ou retrouvé', note: 'authProvider: google' },
        { icon: '🔑', label: 'OAuthExchange créé', note: 'Code temporaire · TTL auto-delete', type: 'token' },
        { icon: '🎟️', label: 'Frontend échange le code → tokens', note: 'Access (15min) + Refresh (1j)', type: 'token' },
        { icon: '🏠', label: 'Redirect → /v1/stores', type: 'success' },
      ],
    },
    {
      id: 'reset',
      icon: '🔒', title: 'Reset Password', desc: 'Réinitialisation par email',
      color: '#f97316',
      bgCls: 'bg-orange-50 dark:bg-orange-900/20', borderCls: 'border-orange-200 dark:border-orange-800', textCls: 'text-orange-700 dark:text-orange-300',
      steps: [
        { icon: '📋', label: 'Saisie email sur /forgot-password' },
        { icon: '📡', label: 'POST /auth/forgot-password', note: 'Vérification email existant' },
        { icon: '📧', label: 'Envoi lien sécurisé via Brevo', note: 'Token unique · TTL 15min', type: 'email' },
        { icon: '🔗', label: 'Clic lien → /reset-password?token=...', note: 'PasswordResetToken vérifié' },
        { icon: '🔑', label: 'Saisie nouveau mot de passe' },
        { icon: '📡', label: 'POST /auth/reset-password', note: 'token.used = true · hash bcrypt' },
        { icon: '✅', label: 'Mot de passe mis à jour', type: 'success' },
        { icon: '🔐', label: 'Redirect → /signin', type: 'success' },
      ],
    },
    {
      id: 'boutique-register',
      icon: '🏪', title: 'Inscription Boutique', desc: 'Multi-étapes → validation admin',
      color: '#10b981',
      bgCls: 'bg-emerald-50 dark:bg-emerald-900/20', borderCls: 'border-emerald-200 dark:border-emerald-800', textCls: 'text-emerald-700 dark:text-emerald-300',
      steps: [
        { icon: '👤', label: 'Étape 1 — Infos propriétaire', note: 'nom, email, mot de passe' },
        { icon: '🏪', label: 'Étape 2 — Infos boutique', note: 'nom, logo, description' },
        { icon: '📋', label: 'Étape 3 — Choix du plan', note: 'Plan A (local) · Plan B (externe)' },
        { icon: '📍', label: 'Étape 4A — Localisation', note: 'Si Plan A → setLocation sur carte', type: 'warning' },
        { icon: '📦', label: 'Étape 4B — Choix de box', note: 'Si Plan B → sélection box disponible', type: 'warning' },
        { icon: '🚚', label: 'Étape 5 — Config livraison', note: 'jours, tarifs/km, heure limite · LivraisonConfig' },
        { icon: '📄', label: 'Étape 6 — Récapitulatif', note: 'Vérification avant soumission' },
        { icon: '📧', label: 'Email OTP de confirmation (Brevo)', note: 'Vérification email propriétaire', type: 'email' },
        { icon: '⏳', label: 'Statut : en attente de validation', note: 'isValidated: false', type: 'warning' },
        { icon: '⚙️', label: 'Admin examine la demande', note: '/admin/app/boutiques/:id' },
        { icon: '✅', label: 'Admin valide → isValidated: true', type: 'success' },
        { icon: '🏠', label: 'Boutique accède à /store/app/dashboard', type: 'success' },
      ],
    },
    {
      id: 'logout',
      icon: '🚪', title: 'Déconnexion', desc: 'Révocation du refresh token',
      color: '#ef4444',
      bgCls: 'bg-red-50 dark:bg-red-900/20', borderCls: 'border-red-200 dark:border-red-800', textCls: 'text-red-700 dark:text-red-300',
      steps: [
        { icon: '🖱️', label: 'Clic "Se déconnecter"' },
        { icon: '📡', label: 'DELETE /auth/logout', note: 'Envoi du refresh token' },
        { icon: '🔴', label: 'isRevoked = true', note: 'RefreshToken en base invalidé', type: 'error' },
        { icon: '🗑️', label: 'localStorage cleared', note: 'Access token + refresh token supprimés' },
        { icon: '🏠', label: 'Redirect → /home', type: 'success' },
      ],
    },
  ];

  get activeFlowData(): AuthFlow {
    return this.flows.find(f => f.id === this.activeFlow)!;
  }

  selectFlow(id: string): void {
    this.activeFlow = id;
  }

  stepColor(type?: string): string {
    const map: Record<string, string> = {
      success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
      error:   'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
      token:   'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      email:   'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
      warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    };
    return map[type ?? ''] ?? 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
  }
}