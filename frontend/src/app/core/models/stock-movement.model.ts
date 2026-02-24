import { Product } from './product.model';

export interface StockMovement {
    _id?: string;
    boutique: string;
    product: string | Product;
    type: 'IN' | 'OUT';
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    note?: string;
    source: 'manual' | 'inventory';
    createdBy: any;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface StockMovementCreate {
    product: string;
    type: 'IN' | 'OUT';
    quantity: number;
    note?: string;
}
