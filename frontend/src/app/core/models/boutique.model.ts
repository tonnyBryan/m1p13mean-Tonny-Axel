export interface Boutique {
  _id: string;
  owner: string; // Reference to User with boutique role
  name: string;
  logo: string; // URL
  description: string;
  boxId?: string;
  plan?: {
    type: 'A' | 'B' | null;
    priceToPayPerMonth: number;
    startDate: string | null;
  };
  payment?: {
    cardNumber?: string;
    cardName?: string;
    expiryDate?: string;
    cvv?: string;
  } | null;
  isLocal: boolean;
  isActive: boolean;
  isValidated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
