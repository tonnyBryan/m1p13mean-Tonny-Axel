import {Category} from "./category.model";

export interface Product {
    _id: string;
    boutique: string;
    name: string;
    description: string;
    regularPrice: number;
    salePrice: number;
    sku: string;
    stock: number;
    stockEngaged : number;
    stockReal : number;
    minOrderQty: number;
    maxOrderQty: number;
    category: Category;
    tags: string[];
    images: string[];
    isActive: boolean;
    isSale: boolean;
    createdAt: string;
    updatedAt: string;
}