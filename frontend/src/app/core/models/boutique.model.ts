export interface Boutique {
  _id: string;
  owner: string; // Reference to User with boutique role
  name: string;
  logo: string; // URL
  description: string;
  isLocal: boolean;
  isActive: boolean;
  isValidated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
