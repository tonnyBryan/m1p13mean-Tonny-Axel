import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Faq {
  question: string;
  answer: string;
  category: string;
  open: boolean;
}

@Component({
  selector: 'app-help-page',
  standalone: true,
    imports: [CommonModule, FormsModule],
  templateUrl: './help-page.component.html',
})
export class HelpPageComponent {

  searchQuery = '';
  activeCategory = 'general';
  filteredFaqs: Faq[] = [];

  categories = [
    { id: 'general',  label: 'General',  icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'orders',   label: 'Orders',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'delivery', label: 'Delivery', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'account',  label: 'Account',  icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'stores',   label: 'Stores',   icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ];

  faqs: Faq[] = [
    // General
    { category: 'general', open: false,
      question: 'What is MallHub?',
      answer: 'MallHub is an all-in-one platform that connects customers with local stores. You can browse products, place orders, and track deliveries — all in one place.' },
    { category: 'general', open: false,
      question: 'Is MallHub free to use?',
      answer: 'Yes! Creating a customer account is completely free. Store owners may have access to different plans depending on their needs.' },
    { category: 'general', open: false,
      question: 'How do I create an account?',
      answer: 'Click "Sign Up" at the top of the page, fill in your details, verify your email address, and you\'re ready to go.' },
    { category: 'general', open: false,
      question: 'Is my personal data safe?',
      answer: 'Absolutely. We follow strict data protection standards and never share your personal information with third parties without your consent. See our Privacy Policy for full details.' },

    // Orders
    { category: 'orders', open: false,
      question: 'How do I place an order?',
      answer: 'Browse any store, add products to your cart, choose delivery or pickup, then proceed to checkout. You\'ll receive a confirmation once your order is placed.' },
    { category: 'orders', open: false,
      question: 'Can I cancel or modify my order?',
      answer: 'You can cancel or modify your order as long as it hasn\'t been confirmed by the store yet. Go to your Orders page and select the relevant order.' },
    { category: 'orders', open: false,
      question: 'How do I track my order?',
      answer: 'Go to your Orders page from your account dashboard. You\'ll see the real-time status of each order from confirmation to delivery.' },
    { category: 'orders', open: false,
      question: 'What payment methods are accepted?',
      answer: 'Available payment methods depend on the store. Most stores accept cash on delivery. Additional payment options may be available per store.' },

    // Delivery
    { category: 'delivery', open: false,
      question: 'How is the delivery fee calculated?',
      answer: 'Each store sets its own delivery rules. A base fee applies within a defined radius, and an extra charge per kilometer applies beyond that distance.' },
    { category: 'delivery', open: false,
      question: 'What if delivery is not available today?',
      answer: 'If a store doesn\'t offer delivery on the current day, you can still place an order and it will be processed on the next available delivery day.' },
    { category: 'delivery', open: false,
      question: 'Can I choose pickup instead of delivery?',
      answer: 'Yes. If the store offers pickup, you can select it at checkout. Pickup is always free.' },
    { category: 'delivery', open: false,
      question: 'What is the order cutoff time?',
      answer: 'Each store sets a cutoff time for same-day delivery. If you order after that time, your order will be scheduled for the next available delivery day.' },

    // Account
    { category: 'account', open: false,
      question: 'How do I verify my email?',
      answer: 'After signing up, check your inbox for a verification email from MallHub. Click the link inside to verify. If you didn\'t receive it, check your spam folder or request a new one from your profile settings.' },
    { category: 'account', open: false,
      question: 'How do I update my profile or address?',
      answer: 'Go to your Profile page from the account menu. You can update your personal information, delivery address, and contact details at any time.' },
    { category: 'account', open: false,
      question: 'I forgot my password. What do I do?',
      answer: 'Click "Forgot password?" on the sign-in page. Enter your email address and we\'ll send you a link to reset your password.' },
    { category: 'account', open: false,
      question: 'How do I delete my account?',
      answer: 'To delete your account, please contact our support team. We\'ll process your request within 7 business days.' },

    // Stores
    { category: 'stores', open: false,
      question: 'How do I open a store on MallHub?',
      answer: 'Create an account and apply for a store role from your dashboard. Once approved, you can set up your store profile, add products, and configure delivery options.' },
    { category: 'stores', open: false,
      question: 'How do I manage my product catalog?',
      answer: 'From your store dashboard, go to Products. You can add new products, upload images, set pricing, manage stock levels and activate or deactivate listings.' },
    { category: 'stores', open: false,
      question: 'How do I configure my delivery settings?',
      answer: 'Go to your store settings and find the Delivery section. You can set delivery days, base distance, pricing rules, and cutoff times.' },
    { category: 'stores', open: false,
      question: 'How do I receive and manage orders?',
      answer: 'New orders appear in your Orders dashboard in real time. You can confirm, update status, or manage each order from there.' },
  ];

  get activeFaqs(): Faq[] {
    return this.faqs.filter(f => f.category === this.activeCategory);
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFaqs = [];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredFaqs = this.faqs.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }
}