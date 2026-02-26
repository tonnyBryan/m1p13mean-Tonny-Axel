export interface ResultSearch {
    type: 'product' | 'boutique';
    id: string;
    name: string;
    description: string;
    image: string | null;
    link: string;
}