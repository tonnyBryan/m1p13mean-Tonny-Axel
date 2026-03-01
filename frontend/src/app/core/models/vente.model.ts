import { Product } from './product.model';
import { User } from './user.model';
import { Boutique } from './boutique.model';

export interface VenteItem {
    product: string | Product;
    productDetails?: Product;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    stockReal: number;
    isSale: boolean;
}

export interface VenteClient {
    name: string;
    phoneNumber?: string;
    email?: string;
    _id?: string | null;
}

export interface Vente {
    _id?: string;
    boutique: string | Boutique;
    seller: string | User;
    client: VenteClient;
    items: VenteItem[];
    paymentMethod: 'cash' | 'mobile_money' | 'card';
    totalAmount: number;
    status: 'draft' | 'paid' | 'canceled';
    saleType: 'dine-in' | 'delivery';
    origin: 'order' | 'direct';
    order?: string | any;
    deliveryPrice?: number;
    saleDate: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}
