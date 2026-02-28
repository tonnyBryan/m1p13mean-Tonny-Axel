export interface Box {
    _id: string;
    number: string;
    pricePerMonth: number;
    isOccupied: boolean;
    boutiqueId?: {
        _id: string;
        name: string;
        logo: string;
    };
    createdAt?: string;
    updatedAt?: string;
}
