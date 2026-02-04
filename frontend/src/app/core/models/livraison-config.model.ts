export interface DeliveryRules {
    minPrice: number;
    baseDistanceKm: number;
    extraPricePerKm: number;
}

export interface DeliveryDay {
    day: number; // 1 to 7
    isActive?: boolean; // Optional property for UI toggling, or strictly part of data?
    // Based on previous valid code, we used isActive. 
    // If the DB only stores active days as a list of numbers, we map it. 
    // But here I'll include it to match the structure implied or needed.
}

export interface LivraisonConfig {
    _id?: string; // Optional for new creation
    boutique: string;
    isDeliveryAvailable: boolean;
    deliveryRules: DeliveryRules;
    deliveryDays: DeliveryDay[];
    isActive: boolean;
    orderCutoffTime: string; // "HH:mm"
    createdAt?: Date;
    updatedAt?: Date;
}
