export interface JwtPayload {
    id: string;
    exp: number;
    role: string;
    boutiqueId? : string;
    email: string;
}
