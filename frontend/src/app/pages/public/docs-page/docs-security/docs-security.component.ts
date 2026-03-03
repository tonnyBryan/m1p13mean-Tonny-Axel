import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface EnvVar {
  key: string;
  example?: string;
  desc: string;
  required: boolean;
  secret: boolean;
}

interface EnvGroup {
  label: string;
  icon: string;
  vars: EnvVar[];
}

@Component({
  selector: 'app-docs-security',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-security.component.html',
})
export class DocsSecurityComponent {

  activeTab: 'security' | 'api' | 'env' = 'security';

  selectTab(tab: 'security' | 'api' | 'env'): void {
    this.activeTab = tab;
  }

  // ── Sécurité ──────────────────────────────
  readonly securityItems = [
    {
      icon: '🔒', title: 'Hashage bcrypt',
      desc: 'Les mots de passe et refresh tokens sont hashés avec bcrypt avant persistance en base. Aucune donnée sensible n\'est stockée en clair.',
      tags: ['password', 'refreshToken'],
    },
    {
      icon: '⏱️', title: 'JWT courte durée',
      desc: 'Access Token TTL 15min — minimise la fenêtre d\'exploitation en cas de vol. Refresh Token TTL 1 jour, hashé et révocable individuellement.',
      tags: ['accessToken: 15min', 'refreshToken: 1j'],
    },
    {
      icon: '🌐', title: 'CORS restreint',
      desc: 'Seules les origines listées dans FRONTEND_URL (variable d\'env, séparées par virgule) sont autorisées. Les requêtes sans origine (serveur à serveur) sont acceptées.',
      tags: ['credentials: true', 'allowedHeaders: Content-Type · Authorization'],
    },
    {
      icon: '🔁', title: 'Révocation des sessions',
      desc: 'Chaque refresh token est stocké en base avec isRevoked. Au logout ou en cas de détection d\'appareil inconnu, le token est révoqué sans affecter les autres sessions.',
      tags: ['isRevoked: true', 'multi-sessions'],
    },
    {
      icon: '🖥️', title: 'Détection nouvel appareil',
      desc: 'Chaque session enregistre device, browser, OS, IP et location. Si une connexion est détectée depuis un appareil non reconnu, une alerte email est envoyée.',
      tags: ['isAlertedToNewDevice', 'Brevo email'],
    },
    {
      icon: '📧', title: 'OTP Email vérification',
      desc: 'Code OTP 6 chiffres envoyé via Brevo. TTL configurable (EMAIL_CODE_EXPIRES_MIN). Maximum de tentatives avant blocage temporaire (EMAIL_MAX_ATTEMPTS_BLOCK_MIN).',
      tags: ['TTL: 15min', 'max attempts', 'block: 15min'],
    },
    {
      icon: '⏳', title: 'Expiration automatique des commandes',
      desc: 'Les commandes en statut draft expirent automatiquement après 1h via un cron job (expireDrafts.job). Le stock engagé est libéré automatiquement.',
      tags: ['expiredAt: createdAt + 1h', 'cron job'],
    },
    {
      icon: '🧹', title: 'Nettoyage des sessions expirées',
      desc: 'Un cron job (cleanExpiredSessions.job) supprime périodiquement les refresh tokens expirés ou révoqués pour maintenir la base propre.',
      tags: ['cleanExpiredSessions.job', 'cron job'],
    },
    {
      icon: '🗑️', title: 'TTL auto MongoDB (OAuthExchange)',
      desc: 'Les codes OAuth temporaires sont auto-supprimés par MongoDB via un index TTL natif dès que expiresAt est atteint. Aucun cron nécessaire.',
      tags: ['index: { expires: 0 }', 'auto-delete'],
    },
    {
      icon: '📦', title: 'Limite taille requêtes',
      desc: 'Les payloads JSON et formulaires sont limités à 20MB pour éviter les attaques par saturation mémoire (body bombing).',
      tags: ['json limit: 20mb', 'urlencoded limit: 20mb'],
    },
    {
      icon: '🤝', title: 'Trust Proxy',
      desc: 'app.set("trust proxy", 1) activé pour récupérer la vraie IP des clients derrière le reverse proxy de Render en production.',
      tags: ['trust proxy: 1', 'Render deploy'],
    },
    {
      icon: '📚', title: 'Swagger / OpenAPI',
      desc: 'Documentation API interactive disponible sur /api-docs en développement. Permet de tester les endpoints directement depuis le navigateur.',
      tags: ['/api-docs', 'swagger-ui-express'],
    },
  ];

  // ── Uniformité API ────────────────────────
  readonly successExample = `{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "_id": "64a1b2c3...",
    "status": "draft",
    "totalAmount": 178000
  }
}`;

  readonly errorExample = `{
  "success": false,
  "message": "Email déjà utilisé",
  "data": null
}`;

  readonly httpCodes = [
    { code: '200', label: 'OK', desc: 'Succès standard (GET, PUT, PATCH)', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { code: '201', label: 'Created', desc: 'Ressource créée (POST)', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { code: '400', label: 'Bad Request', desc: 'Données invalides ou manquantes', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { code: '401', label: 'Unauthorized', desc: 'Token absent ou invalide', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { code: '403', label: 'Forbidden', desc: 'Rôle insuffisant', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { code: '404', label: 'Not Found', desc: 'Ressource introuvable', cls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    { code: '409', label: 'Conflict', desc: 'Doublon (email, SKU…)', cls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
    { code: '420', label: 'Token Expired', desc: 'Access token expiré → auto-refresh', cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    { code: '500', label: 'Internal Server Error', desc: 'Erreur serveur non gérée', cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
  ];

  // ── Variables d'environnement ─────────────
  readonly apiPrefixes = [
    '/api/auth', '/api/users', '/api/products', '/api/boutiques',
    '/api/commandes', '/api/ventes', '/api/categories', '/api/wishlist',
    '/api/product-ratings', '/api/notifications', '/api/stock-movements',
    '/api/inventories', '/api/boxes', '/api/subscriptions',
    '/api/support-requests', '/api/search', '/api/email',
    '/api/chat', '/api/public', '/api/store/register',
    '/api/user-dashboard', '/api/boutique-dashboard', '/api/admin-dashboard',
    '/api/centre-commercial', '/api/system', '/api/paiement-abonnements',
    '/api/publications', '/api-docs',
  ];

  readonly envGroups: EnvGroup[] = [
    {
      label: 'Base de données', icon: '🍃',
      vars: [
        { key: 'MONGO_URI', desc: 'URI de connexion MongoDB Atlas', required: true, secret: true, example: 'mongodb+srv://user:pass@cluster.mongodb.net/db' },
      ],
    },
    {
      label: 'Serveur', icon: '🟢',
      vars: [
        { key: 'PORT', desc: 'Port d\'écoute du serveur', required: false, secret: false, example: '3000' },
        { key: 'NODE_ENV', desc: 'Environnement (development / production)', required: true, secret: false, example: 'development' },
        { key: 'FRONTEND_URL', desc: 'URL(s) Angular autorisées par CORS', required: true, secret: false, example: 'http://localhost:4200' },
        { key: 'APP_NAME', desc: 'Nom de la plateforme', required: false, secret: false, example: 'Shopticus' },
        { key: 'SUPPORT_URL', desc: 'URL page support (emails)', required: false, secret: false, example: 'http://localhost:4200/support' },
        { key: 'PRIVACY_URL', desc: 'URL politique confidentialité (emails)', required: false, secret: false, example: 'http://localhost:4200/privacy' },
      ],
    },
    {
      label: 'JWT', icon: '🎟️',
      vars: [
        { key: 'JWT_SECRET', desc: 'Clé secrète access token', required: true, secret: true, example: 'super_secret_key' },
        { key: 'JWT_EXPIRE', desc: 'TTL access token', required: true, secret: false, example: '15m' },
        { key: 'JWT_REFRESH_SECRET', desc: 'Clé secrète refresh token', required: true, secret: true, example: 'refresh_secret' },
        { key: 'JWT_REFRESH_EXPIRE', desc: 'TTL refresh token', required: true, secret: false, example: '1d' },
      ],
    },
    {
      label: 'Cloudinary', icon: '☁️',
      vars: [
        { key: 'CLOUDINARY_CLOUD_NAME', desc: 'Nom du cloud Cloudinary', required: true, secret: false, example: 'dqooludk7' },
        { key: 'CLOUDINARY_API_KEY', desc: 'Clé API Cloudinary', required: true, secret: true },
        { key: 'CLOUDINARY_API_SECRET', desc: 'Secret API Cloudinary', required: true, secret: true },
      ],
    },
    {
      label: 'Emailing (Brevo)', icon: '📧',
      vars: [
        { key: 'BREVO_API_KEY', desc: 'Clé API Brevo', required: true, secret: true },
        { key: 'MAIL_FROM', desc: 'Adresse email expéditeur', required: true, secret: false, example: 'shopticus.mall@gmail.com' },
        { key: 'EMAIL_RESEND_DELAY', desc: 'Délai avant renvoi OTP (secondes)', required: false, secret: false, example: '60' },
        { key: 'EMAIL_CODE_EXPIRES_MIN', desc: 'TTL du code OTP (minutes)', required: false, secret: false, example: '15' },
        { key: 'EMAIL_MAX_ATTEMPTS_BLOCK_MIN', desc: 'Blocage après trop de tentatives (min)', required: false, secret: false, example: '15' },
      ],
    },
    {
      label: 'Google OAuth', icon: '🔵',
      vars: [
        { key: 'GOOGLE_CLIENT_ID', desc: 'Client ID Google OAuth', required: true, secret: true },
        { key: 'GOOGLE_CLIENT_SECRET', desc: 'Client Secret Google OAuth', required: true, secret: true },
        { key: 'GOOGLE_REDIRECT_URI', desc: 'URI de callback OAuth', required: true, secret: false, example: 'http://localhost:3000/api/auth/google/callback' },
      ],
    },
    {
      label: 'IA / Chatbot', icon: '🤖',
      vars: [
        { key: 'LLM_PROVIDER', desc: 'Provider LLM utilisé', required: true, secret: false, example: 'groq' },
        { key: 'GROQ_API_KEY', desc: 'Clé API Groq', required: false, secret: true },
        { key: 'GEMINI_API_KEY', desc: 'Clé API Google Gemini', required: false, secret: true },
        { key: 'GEMINI_MODEL', desc: 'Modèle Gemini utilisé', required: false, secret: false, example: 'gemini-1.5-flash' },
      ],
    },
  ];
}