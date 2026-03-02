import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SchemaField {
  key: string;
  type: 'objectid' | 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'enum' | 'mixed';
  ref?: string;
  enumValues?: string[];
  default?: string;
  required?: boolean;
  unique?: boolean;
  note?: string;
  children?: SchemaField[];
}

export interface CollectionDef {
  name: string;
  icon: string;
  desc: string;
  group: string;
  fields: SchemaField[];
  relations?: string[];
}

export interface CollectionGroup {
  id: string;
  label: string;
  color: string;
  bgCls: string;
  textCls: string;
  borderCls: string;
  collections: string[];
}

@Component({
  selector: 'app-docs-mongodb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-mongodb.component.html',
})
export class DocsMongodbComponent {

  activeCollection = 'User';
  collapsedKeys: Set<string> = new Set();

  readonly groups: CollectionGroup[] = [
    {
      id: 'auth', label: 'Auth & Sécurité', color: '#6366f1',
      bgCls: 'bg-indigo-50 dark:bg-indigo-900/20', textCls: 'text-indigo-700 dark:text-indigo-300', borderCls: 'border-indigo-200 dark:border-indigo-800',
      collections: ['User', 'UserProfile', 'RefreshToken', 'EmailVerification', 'PasswordResetToken', 'OAuthExchange'],
    },
    {
      id: 'commerce', label: 'Commerce', color: '#f59e0b',
      bgCls: 'bg-amber-50 dark:bg-amber-900/20', textCls: 'text-amber-700 dark:text-amber-300', borderCls: 'border-amber-200 dark:border-amber-800',
      collections: ['Commande', 'Vente', 'Wishlist', 'ProductRating'],
    },
    {
      id: 'catalogue', label: 'Catalogue', color: '#3b82f6',
      bgCls: 'bg-blue-50 dark:bg-blue-900/20', textCls: 'text-blue-700 dark:text-blue-300', borderCls: 'border-blue-200 dark:border-blue-800',
      collections: ['Product', 'Category'],
    },
    {
      id: 'boutique', label: 'Boutique', color: '#10b981',
      bgCls: 'bg-emerald-50 dark:bg-emerald-900/20', textCls: 'text-emerald-700 dark:text-emerald-300', borderCls: 'border-emerald-200 dark:border-emerald-800',
      collections: ['Boutique', 'Box', 'CentreCommercial', 'LivraisonConfig'],
    },
    {
      id: 'stock', label: 'Stock', color: '#f97316',
      bgCls: 'bg-orange-50 dark:bg-orange-900/20', textCls: 'text-orange-700 dark:text-orange-300', borderCls: 'border-orange-200 dark:border-orange-800',
      collections: ['StockMovement', 'InventoryCount'],
    },
    {
      id: 'system', label: 'Système', color: '#8b5cf6',
      bgCls: 'bg-purple-50 dark:bg-purple-900/20', textCls: 'text-purple-700 dark:text-purple-300', borderCls: 'border-purple-200 dark:border-purple-800',
      collections: ['Notification', 'Subscription'],
    },
  ];

  readonly collections: CollectionDef[] = [
    {
      name: 'User', icon: '👤', group: 'auth',
      desc: 'Comptes utilisateurs — tous rôles confondus (admin, boutique, user).',
      relations: ['UserProfile', 'RefreshToken'],
      fields: [
        { key: '_id',                   type: 'objectid' },
        { key: 'name',                  type: 'string',  required: true },
        { key: 'email',                 type: 'string',  required: true, unique: true },
        { key: 'password',              type: 'string',  note: 'Requis si authProvider = local' },
        { key: 'authProvider',          type: 'enum',    enumValues: ['local', 'google'], default: 'local' },
        { key: 'googleId',              type: 'string',  unique: true, note: 'sparse' },
        { key: 'role',                  type: 'enum',    enumValues: ['admin', 'boutique', 'user'], default: 'user' },
        { key: 'isActive',              type: 'boolean', default: 'true' },
        { key: 'isEmailVerified',       type: 'boolean', default: 'false' },
        { key: 'isAlertedToNewDevice',  type: 'boolean', default: 'false' },
        { key: 'createdAt',             type: 'date' },
        { key: 'updatedAt',             type: 'date' },
        { key: 'virtual → profile',     type: 'object',  ref: 'UserProfile', note: 'virtual populate' },
      ],
    },
    {
      name: 'UserProfile', icon: '🪪', group: 'auth',
      desc: 'Profil étendu lié à un User — infos personnelles, adresses, carte bancaire.',
      relations: ['User'],
      fields: [
        { key: '_id',         type: 'objectid' },
        { key: 'user',        type: 'objectid', ref: 'User', required: true, unique: true },
        { key: 'firstName',   type: 'string',   required: true },
        { key: 'lastName',    type: 'string',   required: true },
        { key: 'phoneNumber', type: 'string' },
        { key: 'photo',       type: 'string',   default: '/user.svg' },
        { key: 'description', type: 'string' },
        { key: 'addresses',   type: 'array',    note: 'Array d\'objets adresse',
          children: [
            { key: 'label',       type: 'string',  required: true },
            { key: 'latitude',    type: 'number',  required: true },
            { key: 'longitude',   type: 'number',  required: true },
            { key: 'description', type: 'string',  required: true },
            { key: 'isDefault',   type: 'boolean', default: 'false' },
          ]
        },
        { key: 'cardInfo',    type: 'object',   note: '⚠️ Maquette — en prod: délégué à un provider PCI-DSS',
          children: [
            { key: 'cardNumber',  type: 'string' },
            { key: 'cardName',    type: 'string' },
            { key: 'expiryDate',  type: 'string' },
          ]
        },
        { key: 'createdAt',   type: 'date' },
        { key: 'updatedAt',   type: 'date' },
      ],
    },
    {
      name: 'RefreshToken', icon: '🔑', group: 'auth',
      desc: 'Tokens de refresh JWT — stockés hashés avec infos de session (device, IP, OS).',
      relations: ['User'],
      fields: [
        { key: '_id',        type: 'objectid' },
        { key: 'user',       type: 'objectid', ref: 'User', required: true },
        { key: 'token',      type: 'string',   required: true, note: 'Hashé en base' },
        { key: 'expiresAt',  type: 'date',     required: true },
        { key: 'ipAddress',  type: 'string',   default: 'null' },
        { key: 'userAgent',  type: 'string',   default: 'null' },
        { key: 'device',     type: 'string',   note: 'Mobile · Desktop · Tablet' },
        { key: 'browser',    type: 'string',   note: 'Chrome · Firefox · Safari' },
        { key: 'os',         type: 'string',   note: 'Windows · macOS · Android · iOS' },
        { key: 'location',   type: 'string',   note: 'ex: Antananarivo, MG' },
        { key: 'isRevoked',  type: 'boolean',  default: 'false' },
        { key: 'createdAt',  type: 'date' },
      ],
    },
    {
      name: 'EmailVerification', icon: '📧', group: 'auth',
      desc: 'Codes de vérification email — OTP avec TTL, tentatives et statut.',
      relations: ['User'],
      fields: [
        { key: '_id',          type: 'objectid' },
        { key: 'email',        type: 'string',  required: true },
        { key: 'userId',       type: 'objectid', ref: 'User', default: 'null' },
        { key: 'code',         type: 'string',  required: true },
        { key: 'isUsed',       type: 'boolean', default: 'false' },
        { key: 'attempts',     type: 'number',  default: '0' },
        { key: 'expiresAt',    type: 'date',    required: true },
        { key: 'authorizedAt', type: 'date',    default: 'null' },
        { key: 'createdAt',    type: 'date' },
        { key: 'updatedAt',    type: 'date' },
      ],
    },
    {
      name: 'PasswordResetToken', icon: '🔒', group: 'auth',
      desc: 'Tokens de réinitialisation de mot de passe avec TTL et statut d\'utilisation.',
      relations: ['User'],
      fields: [
        { key: '_id',       type: 'objectid' },
        { key: 'user',      type: 'objectid', ref: 'User', required: true },
        { key: 'email',     type: 'string',   required: true },
        { key: 'token',     type: 'string',   required: true, unique: true },
        { key: 'expiresAt', type: 'date',     required: true },
        { key: 'used',      type: 'boolean',  default: 'false' },
        { key: 'createdAt', type: 'date' },
      ],
    },
    {
      name: 'OAuthExchange', icon: '🔗', group: 'auth',
      desc: 'Codes d\'échange OAuth temporaires — auto-supprimés via TTL index MongoDB.',
      fields: [
        { key: '_id',          type: 'objectid' },
        { key: 'code',         type: 'string', required: true, unique: true, note: 'Index TTL' },
        { key: 'refreshToken', type: 'string', required: true },
        { key: 'expiresAt',    type: 'date',   required: true, note: 'TTL auto-delete' },
      ],
    },
    {
      name: 'Commande', icon: '🛒', group: 'commerce',
      desc: 'Commandes passées par les users — online, avec statuts et expiration automatique à 1h.',
      relations: ['User', 'Boutique', 'Product'],
      fields: [
        { key: '_id',              type: 'objectid' },
        { key: 'user',             type: 'objectid', ref: 'User',     required: true },
        { key: 'boutique',         type: 'objectid', ref: 'Boutique', required: true },
        { key: 'products',         type: 'array',    note: 'Snapshot produits commandés',
          children: [
            { key: 'product',    type: 'objectid', ref: 'Product', required: true },
            { key: 'quantity',   type: 'number',   default: '1' },
            { key: 'unitPrice',  type: 'number',   required: true },
            { key: 'totalPrice', type: 'number',   required: true },
            { key: 'isSale',     type: 'boolean',  default: 'false' },
          ]
        },
        { key: 'deliveryMode',       type: 'enum',    enumValues: ['pickup', 'delivery'], default: 'null' },
        { key: 'deliveryAddress',    type: 'object',  note: 'Adresse de livraison',
          children: [
            { key: 'latitude',    type: 'number' },
            { key: 'longitude',   type: 'number' },
            { key: 'label',       type: 'string' },
            { key: 'description', type: 'string' },
            { key: 'price',       type: 'number', default: '0' },
          ]
        },
        { key: 'paymentMethod',    type: 'string',  default: 'null' },
        { key: 'status',           type: 'enum',    enumValues: ['draft','paid','accepted','delivering','success','canceled','expired'] },
        { key: 'reasonCancellation', type: 'string', default: 'null' },
        { key: 'totalAmount',      type: 'number',  default: '0' },
        { key: 'expiredAt',        type: 'date',    note: 'createdAt + 1h (pre save hook)' },
        { key: 'createdAt',        type: 'date' },
        { key: 'updatedAt',        type: 'date' },
      ],
    },
    {
      name: 'Vente', icon: '💰', group: 'commerce',
      desc: 'Ventes directes (caisse) — clients de passage ou liées à une commande online.',
      relations: ['Boutique', 'User', 'Product', 'Commande'],
      fields: [
        { key: '_id',          type: 'objectid' },
        { key: 'boutique',     type: 'objectid', ref: 'Boutique', required: true },
        { key: 'seller',       type: 'objectid', ref: 'User',     required: true },
        { key: 'client',       type: 'object',   note: 'Client (passager ou inscrit)',
          children: [
            { key: 'name',        type: 'string',   required: true },
            { key: 'phoneNumber', type: 'string',   default: 'null' },
            { key: 'email',       type: 'string',   default: 'null' },
            { key: '_id',         type: 'objectid', ref: 'User', default: 'null', note: 'null si client passager' },
          ]
        },
        { key: 'items',          type: 'array',  note: 'Produits vendus',
          children: [
            { key: 'product',    type: 'objectid', ref: 'Product', required: true },
            { key: 'quantity',   type: 'number',   required: true },
            { key: 'unitPrice',  type: 'number',   required: true },
            { key: 'totalPrice', type: 'number',   required: true },
            { key: 'isSale',     type: 'boolean',  default: 'false' },
          ]
        },
        { key: 'paymentMethod',  type: 'enum',    enumValues: ['cash', 'mobile_money', 'card'], required: true },
        { key: 'totalAmount',    type: 'number',  required: true },
        { key: 'status',         type: 'enum',    enumValues: ['draft', 'paid', 'canceled'], default: 'draft' },
        { key: 'saleType',       type: 'enum',    enumValues: ['dine-in', 'delivery'],        default: 'dine-in' },
        { key: 'origin',         type: 'enum',    enumValues: ['direct', 'order'],            default: 'direct' },
        { key: 'order',          type: 'objectid', ref: 'Commande', default: 'null', note: 'Lié si origin=order' },
        { key: 'deliveryPrice',  type: 'number',  default: '0' },
        { key: 'saleDate',       type: 'date',    default: 'Date.now' },
        { key: 'createdAt',      type: 'date' },
        { key: 'updatedAt',      type: 'date' },
      ],
    },
    {
      name: 'Wishlist', icon: '❤️', group: 'commerce',
      desc: 'Liste de souhaits — un document par user, tableau de produits avec boutique associée.',
      relations: ['User', 'Product', 'Boutique'],
      fields: [
        { key: '_id',      type: 'objectid' },
        { key: 'user',     type: 'objectid', ref: 'User', required: true, unique: true },
        { key: 'products', type: 'array',    note: 'Produits sauvegardés',
          children: [
            { key: 'product',  type: 'objectid', ref: 'Product',  required: true },
            { key: 'boutique', type: 'objectid', ref: 'Boutique', required: true },
            { key: 'addedAt',  type: 'date',     default: 'Date.now' },
          ]
        },
        { key: 'createdAt', type: 'date' },
        { key: 'updatedAt', type: 'date' },
      ],
    },
    {
      name: 'ProductRating', icon: '⭐', group: 'commerce',
      desc: 'Avis produits — unique par user/product. Post-save hook recalcule avgRating sur Product.',
      relations: ['Product', 'User'],
      fields: [
        { key: '_id',      type: 'objectid' },
        { key: 'product',  type: 'objectid', ref: 'Product', required: true },
        { key: 'user',     type: 'objectid', ref: 'User',    required: true },
        { key: 'rating',   type: 'number',   required: true, note: 'Min: 1 · Max: 5' },
        { key: 'comment',  type: 'string',   required: true, note: 'Min: 3 caractères' },
        { key: 'createdAt', type: 'date' },
        { key: 'updatedAt', type: 'date' },
      ],
    },
    {
      name: 'Product', icon: '📦', group: 'catalogue',
      desc: 'Produits des boutiques — avec stock engagé, prix soldé, tags et avis agrégés.',
      relations: ['Boutique', 'Category'],
      fields: [
        { key: '_id',           type: 'objectid' },
        { key: 'boutique',      type: 'objectid', ref: 'Boutique', required: true },
        { key: 'category',      type: 'objectid', ref: 'Category', required: true },
        { key: 'name',          type: 'string',   required: true },
        { key: 'description',   type: 'string',   required: true },
        { key: 'sku',           type: 'string',   required: true },
        { key: 'stock',         type: 'number',   default: '0' },
        { key: 'stockEngaged',  type: 'number',   default: '0', note: 'Stock réservé par commandes' },
        { key: 'minOrderQty',   type: 'number',   default: '1' },
        { key: 'maxOrderQty',   type: 'number',   default: '50' },
        { key: 'regularPrice',  type: 'number',   required: true },
        { key: 'salePrice',     type: 'number' },
        { key: 'isSale',        type: 'boolean',  default: 'false' },
        { key: 'tags',          type: 'array',    note: 'String[]' },
        { key: 'images',        type: 'array',    note: 'String[] — URLs Cloudinary' },
        { key: 'avgRating',     type: 'number',   default: '0', note: 'Mis à jour par ProductRating hook' },
        { key: 'totalRatings',  type: 'number',   default: '0' },
        { key: 'isActive',      type: 'boolean',  default: 'true' },
        { key: 'virtual → effectivePrice', type: 'number', note: 'salePrice si isSale, sinon regularPrice' },
        { key: 'virtual → stockReal',      type: 'number', note: 'stock - stockEngaged' },
        { key: 'createdAt',     type: 'date' },
        { key: 'updatedAt',     type: 'date' },
      ],
    },
    {
      name: 'Category', icon: '🏷️', group: 'catalogue',
      desc: 'Catégories de produits — propres à chaque boutique, nom unique par boutique.',
      relations: ['Boutique'],
      fields: [
        { key: '_id',        type: 'objectid' },
        { key: 'boutique',   type: 'objectid', ref: 'Boutique', required: true },
        { key: 'name',       type: 'string',   required: true, note: 'Unique par boutique' },
        { key: 'description',type: 'string' },
        { key: 'isActive',   type: 'boolean',  default: 'true' },
        { key: 'createdAt',  type: 'date' },
        { key: 'updatedAt',  type: 'date' },
      ],
    },
    {
      name: 'Boutique', icon: '🏪', group: 'boutique',
      desc: 'Stores vendeurs — locaux (dans le centre) ou externes, avec plan d\'abonnement.',
      relations: ['User', 'Box'],
      fields: [
        { key: '_id',         type: 'objectid' },
        { key: 'owner',       type: 'objectid', ref: 'User', required: true },
        { key: 'name',        type: 'string',   required: true },
        { key: 'logo',        type: 'string',   required: true, note: 'URL Cloudinary' },
        { key: 'description', type: 'string',   required: true },
        { key: 'isActive',    type: 'boolean',  default: 'true' },
        { key: 'isValidated', type: 'boolean',  default: 'false', note: 'Validé par Admin' },
        { key: 'isLocal',     type: 'boolean',  default: 'true',  note: 'true = boutique du centre' },
        { key: 'address',     type: 'object',
          children: [
            { key: 'latitude',  type: 'number' },
            { key: 'longitude', type: 'number' },
          ]
        },
        { key: 'boxId',       type: 'objectid', ref: 'Box', default: 'null' },
        { key: 'plan',        type: 'object',   note: 'Plan d\'abonnement',
          children: [
            { key: 'type',              type: 'enum',   enumValues: ['A', 'B'], default: 'null' },
            { key: 'priceToPayPerMonth',type: 'number', default: '0' },
            { key: 'startDate',         type: 'date',   default: 'null' },
          ]
        },
        { key: 'payment',     type: 'object',   note: '⚠️ Maquette — en prod: délégué à un provider PCI-DSS',
          children: [
            { key: 'cardNumber',  type: 'string' },
            { key: 'cardName',    type: 'string' },
            { key: 'expiryDate',  type: 'string' },
          ]
        },
        { key: 'createdAt',   type: 'date' },
        { key: 'updatedAt',   type: 'date' },
      ],
    },
    {
      name: 'Box', icon: '📫', group: 'boutique',
      desc: 'Boxes physiques du centre commercial — assignées aux boutiques locales.',
      relations: ['Boutique'],
      fields: [
        { key: '_id',          type: 'objectid' },
        { key: 'number',       type: 'string',   required: true, unique: true },
        { key: 'pricePerMonth',type: 'number',   required: true },
        { key: 'isOccupied',   type: 'boolean',  default: 'false' },
        { key: 'boutiqueId',   type: 'objectid', ref: 'Boutique', default: 'null' },
        { key: 'createdAt',    type: 'date' },
        { key: 'updatedAt',    type: 'date' },
      ],
    },
    {
      name: 'CentreCommercial', icon: '🏬', group: 'boutique',
      desc: 'Informations du centre commercial — horaires, localisation, contact, plans tarifaires.',
      fields: [
        { key: '_id',         type: 'objectid' },
        { key: 'name',        type: 'string',   required: true },
        { key: 'description', type: 'string' },
        { key: 'logo',        type: 'object',   children: [{ key: 'url', type: 'string' }] },
        { key: 'coverImage',  type: 'object',   children: [{ key: 'url', type: 'string' }] },
        { key: 'contact',     type: 'object',
          children: [
            { key: 'phone',   type: 'string' },
            { key: 'email',   type: 'string' },
            { key: 'website', type: 'string' },
          ]
        },
        { key: 'location',    type: 'object',
          children: [
            { key: 'address',    type: 'string' },
            { key: 'city',       type: 'string' },
            { key: 'postalCode', type: 'string' },
            { key: 'country',    type: 'string' },
            { key: 'coordinates', type: 'object', children: [
                { key: 'latitude',  type: 'number' },
                { key: 'longitude', type: 'number' },
              ]},
          ]
        },
        { key: 'planAPrice',    type: 'number',  default: '0' },
        { key: 'planBPrice',    type: 'number',  default: '0' },
        { key: 'openingHours',  type: 'array',   note: 'Horaires par jour',
          children: [
            { key: 'day',       type: 'number', note: '1=Lundi … 7=Dimanche' },
            { key: 'openTime',  type: 'string', note: '"HH:mm"' },
            { key: 'closeTime', type: 'string', note: '"HH:mm"' },
            { key: 'isClosed',  type: 'boolean', default: 'false' },
          ]
        },
        { key: 'services',    type: 'array',   note: 'String[] — services disponibles' },
        { key: 'createdAt',   type: 'date' },
        { key: 'updatedAt',   type: 'date' },
      ],
    },
    {
      name: 'LivraisonConfig', icon: '🚚', group: 'boutique',
      desc: 'Configuration livraison par boutique — règles tarifaires, jours et heure limite.',
      relations: ['Boutique'],
      fields: [
        { key: '_id',                  type: 'objectid' },
        { key: 'boutique',             type: 'objectid', ref: 'Boutique', required: true },
        { key: 'isDeliveryAvailable',  type: 'boolean',  default: 'true' },
        { key: 'deliveryRules',        type: 'object',
          children: [
            { key: 'minPrice',         type: 'number', default: '0' },
            { key: 'baseDistanceKm',   type: 'number', default: '0' },
            { key: 'extraPricePerKm',  type: 'number', default: '0' },
          ]
        },
        { key: 'deliveryDays',         type: 'array',  note: 'Jours de livraison actifs',
          children: [
            { key: 'day',      type: 'number',  note: '1=Lundi … 7=Dimanche' },
            { key: 'isActive', type: 'boolean', default: 'true' },
          ]
        },
        { key: 'orderCutoffTime',      type: 'string',  default: '"18:00"', note: '"HH:mm"' },
        { key: 'isActive',             type: 'boolean', default: 'true' },
        { key: 'createdAt',            type: 'date' },
        { key: 'updatedAt',            type: 'date' },
      ],
    },
    {
      name: 'StockMovement', icon: '📈', group: 'stock',
      desc: 'Historique des mouvements de stock — entrées/sorties manuelles, inventaires ou ventes.',
      relations: ['Boutique', 'Product', 'User'],
      fields: [
        { key: '_id',         type: 'objectid' },
        { key: 'boutique',    type: 'objectid', ref: 'Boutique', required: true },
        { key: 'product',     type: 'objectid', ref: 'Product',  required: true },
        { key: 'type',        type: 'enum',     enumValues: ['IN', 'OUT'], required: true },
        { key: 'quantity',    type: 'number',   required: true, note: 'Min: 0' },
        { key: 'stockBefore', type: 'number',   required: true },
        { key: 'stockAfter',  type: 'number',   required: true },
        { key: 'note',        type: 'string' },
        { key: 'source',      type: 'enum',     enumValues: ['manual', 'inventory', 'sale'], default: 'manual' },
        { key: 'createdBy',   type: 'objectid', ref: 'User', required: true },
        { key: 'createdAt',   type: 'date' },
        { key: 'updatedAt',   type: 'date' },
      ],
    },
    {
      name: 'InventoryCount', icon: '🗃️', group: 'stock',
      desc: 'Sessions d\'inventaire — comptage physique avec régularisation automatique du stock.',
      relations: ['Boutique', 'User', 'Product', 'StockMovement'],
      fields: [
        { key: '_id',       type: 'objectid' },
        { key: 'boutique',  type: 'objectid', ref: 'Boutique', required: true },
        { key: 'createdBy', type: 'objectid', ref: 'User',     required: true },
        { key: 'note',      type: 'string' },
        { key: 'lines',     type: 'array',   note: 'Lignes d\'inventaire',
          children: [
            { key: 'product',          type: 'objectid', ref: 'Product',       required: true },
            { key: 'countedQuantity',  type: 'number',   required: true },
            { key: 'stockBefore',      type: 'number',   required: true },
            { key: 'movementCreated',  type: 'boolean',  default: 'false' },
            { key: 'movementId',       type: 'objectid', ref: 'StockMovement' },
          ]
        },
        { key: 'createdAt', type: 'date' },
        { key: 'updatedAt', type: 'date' },
      ],
    },
    {
      name: 'Notification', icon: '🔔', group: 'system',
      desc: 'Notifications in-app — multi-canal (order, sale, stock, system) avec payload flexible.',
      relations: ['User'],
      fields: [
        { key: '_id',       type: 'objectid' },
        { key: 'recipient', type: 'objectid', ref: 'User', required: true },
        { key: 'channel',   type: 'enum',     enumValues: ['system', 'order', 'sale', 'stock', 'message'], default: 'system' },
        { key: 'type',      type: 'string',   required: true, note: 'ex: order_created, stock_low' },
        { key: 'severity',  type: 'enum',     enumValues: ['info', 'success', 'warning', 'error'], default: 'info' },
        { key: 'title',     type: 'string',   required: true },
        { key: 'message',   type: 'string',   required: true },
        { key: 'payload',   type: 'mixed',    default: '{}', note: 'Données dynamiques (orderId, url…)' },
        { key: 'url',       type: 'string',   default: 'null' },
        { key: 'isRead',    type: 'boolean',  default: 'false' },
        { key: 'createdAt', type: 'date' },
        { key: 'updatedAt', type: 'date' },
      ],
    },
    {
      name: 'Subscription', icon: '📮', group: 'system',
      desc: 'Abonnements newsletter — emails uniques collectés depuis le footer de la landing.',
      fields: [
        { key: '_id',       type: 'objectid' },
        { key: 'email',     type: 'string',  required: true, unique: true, note: 'lowercase · trim' },
        { key: 'createdAt', type: 'date' },
        { key: 'updatedAt', type: 'date' },
      ],
    },
  ];

  get activeCol(): CollectionDef {
    return this.collections.find(c => c.name === this.activeCollection)!;
  }

  getGroupOf(name: string): CollectionGroup {
    const col = this.collections.find(c => c.name === name)!;
    return this.groups.find(g => g.id === col.group)!;
  }

  getGroupForActive(): CollectionGroup {
    return this.getGroupOf(this.activeCollection);
  }

  selectCollection(name: string): void {
    this.activeCollection = name;
    this.collapsedKeys = new Set();
  }

  toggleCollapse(key: string): void {
    if (this.collapsedKeys.has(key)) {
      this.collapsedKeys.delete(key);
    } else {
      this.collapsedKeys.add(key);
    }
  }

  isCollapsed(key: string): boolean {
    return this.collapsedKeys.has(key);
  }

  typeColor(type: SchemaField['type']): string {
    const map: Record<string, string> = {
      objectid: 'text-orange-500 dark:text-orange-400',
      string:   'text-green-600 dark:text-green-400',
      number:   'text-blue-600 dark:text-blue-400',
      boolean:  'text-cyan-600 dark:text-cyan-400',
      date:     'text-teal-600 dark:text-teal-400',
      enum:     'text-purple-600 dark:text-purple-400',
      array:    'text-yellow-600 dark:text-yellow-500',
      object:   'text-gray-500 dark:text-gray-400',
      mixed:    'text-pink-600 dark:text-pink-400',
    };
    return map[type] ?? 'text-gray-500';
  }

  readonly typeList = [
    { type: 'objectid' as const, label: 'ObjectId' },
    { type: 'string'   as const, label: 'String'   },
    { type: 'number'   as const, label: 'Number'   },
    { type: 'boolean'  as const, label: 'Boolean'  },
    { type: 'date'     as const, label: 'Date'     },
    { type: 'enum'     as const, label: 'Enum'     },
    { type: 'array'    as const, label: 'Array'    },
    { type: 'object'   as const, label: 'Object'   },
    { type: 'mixed'    as const, label: 'Mixed'    },
  ];

  getIcon(name: string): string {
    return this.collections.find(c => c.name === name)?.icon ?? '📄';
  }

  typeLabel(type: SchemaField['type']): string {
    const map: Record<string, string> = {
      objectid: 'ObjectId',
      string:   'String',
      number:   'Number',
      boolean:  'Boolean',
      date:     'Date',
      enum:     'Enum',
      array:    'Array',
      object:   'Object',
      mixed:    'Mixed',
    };
    return map[type] ?? type;
  }
}