import { User } from './user.model';

export interface Address {
    _id?: string;
    label: string;
    latitude: number;
    longitude: number;
    description: string;
    isDefault: boolean;
}

export interface UserProfile {
    _id: string;
    user: string | User;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    description: string;
    photo: string;
    addresses: Address[];
    createdAt: string;
    updatedAt: string;
}
