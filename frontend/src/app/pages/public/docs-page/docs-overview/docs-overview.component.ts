import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-docs-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-overview.component.html',
})
export class DocsOverviewComponent {

  developers = [
    { num: 'ETU002768', name: 'ANDERSON Tonny Bryan',  initials: 'AB' },
    { num: 'ETU002442', name: 'MAMIRAZANA Isis Axel',  initials: 'MI' },
  ];

  stack = [
    {
      icon: '🅰️', name: 'Angular',    version: 'v21',
      desc: 'Frontend SPA · Standalone components · Lazy loading',
      bg: 'rgba(221,0,49,0.08)', color: '#dd0031',
    },
    {
      icon: '🌊', name: 'Tailwind CSS', version: 'v3',
      desc: 'Utility-first CSS · Dark mode · Responsive',
      bg: 'rgba(6,182,212,0.08)', color: '#06b6d4',
    },
    {
      icon: '🟢', name: 'Node.js',     version: 'v21.19',
      desc: 'Runtime backend · Express REST API',
      bg: 'rgba(34,197,94,0.08)', color: '#16a34a',
    },
    {
      icon: '🍃', name: 'MongoDB',     version: 'Atlas',
      desc: 'Base de données NoSQL · Mongoose ODM',
      bg: 'rgba(0,169,80,0.08)', color: '#00a950',
    },
    {
      icon: '☁️', name: 'Cloudinary',  version: 'API',
      desc: 'Stockage & optimisation des images',
      bg: 'rgba(59,130,246,0.08)', color: '#3b82f6',
    },
    {
      icon: '📧', name: 'Brevo',       version: 'API',
      desc: 'Emailing transactionnel · Vérification email',
      bg: 'rgba(99,102,241,0.08)', color: '#6366f1',
    },
    {
      icon: '▲',  name: 'Vercel',      version: 'Deploy',
      desc: 'Déploiement frontend Angular',
      bg: 'rgba(0,0,0,0.05)', color: '#374151',
    },
    {
      icon: '🎯', name: 'Render',      version: 'Deploy',
      desc: 'Déploiement backend Node.js + Express',
      bg: 'rgba(99,102,241,0.08)', color: '#6366f1',
    },
  ];

  clients = [
    { icon: '👤', name: 'Guest',    sub: '/discover',        cls: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
    { icon: '🛍️',  name: 'User',     sub: '/v1/...',           cls: 'border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' },
    { icon: '🏪', name: 'Boutique', sub: '/store/app/...',   cls: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
  ];

  services = [
    { icon: '🍃', name: 'MongoDB Atlas', sub: 'Base de données', cls: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
    { icon: '☁️', name: 'Cloudinary',    sub: 'Images',          cls: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
    { icon: '📧', name: 'Brevo',         sub: 'Emailing',        cls: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' },
    { icon: '🔑', name: 'Google OAuth',  sub: 'Auth sociale',    cls: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
  ];

  spaces = [
    {
      icon: '🌐', name: 'Public',   url: '/ · /discover',
      access: 'Tout le monde',  deploy: 'Vercel',
      codeCls:  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      badgeCls: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    },
    {
      icon: '🛍️',  name: 'User App', url: '/v1/...',
      access: 'role: user',     deploy: 'Vercel',
      codeCls:  'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400',
      badgeCls: 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400',
    },
    {
      icon: '🏪', name: 'Boutique', url: '/store/app/...',
      access: 'role: boutique', deploy: 'Vercel',
      codeCls:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
      badgeCls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    },
    {
      icon: '⚙️', name: 'Admin',    url: '/admin/app/...',
      access: 'role: admin',    deploy: 'Vercel',
      codeCls:  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
      badgeCls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    },
  ];
}