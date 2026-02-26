import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import {StoreRegisterData} from "../../pages/boutique/store-register/store-register.component";

@Injectable({
    providedIn: 'root'
})
export class StoreRegisterService {
    private readonly endpoint = 'store/register';

    constructor(private api: ApiService) {}

    /**
     * Vérifie si l'email est déjà utilisé par une boutique
     */
    checkEmail(email: string): Observable<any> {
        return this.api.post<any>(`${this.endpoint}/check-email`, { email });
    }

    /**
     * Envoie un code OTP à l'email fourni
     */
    sendOtp(email: string, name: string): Observable<any> {
        return this.api.post<any>(`${this.endpoint}/send-otp`, { email, name });
    }

    /**
     * Soumet l'inscription avec le code OTP + toutes les données du formulaire
     */
    submitRegister(formData: StoreRegisterData, code: string): Observable<any> {
        const payload = {
            code,
            manager: {
                firstName: formData.manager.firstName,
                lastName: formData.manager.lastName,
                email: formData.manager.email,
                password: formData.manager.password,
            },
            boutique: {
                name: formData.boutique.name,
                description: formData.boutique.description
                // logo géré séparément via FormData si upload fichier
            },
            plan: {
                type: formData.plan.type,
                box: formData.plan.box,
                lat: formData.plan.lat,
                lng: formData.plan.lng
            },
            livraison: {
                isDeliveryAvailable: formData.livraison.isDeliveryAvailable,
                minPrice: formData.livraison.minPrice,
                baseDistanceKm: formData.livraison.baseDistanceKm,
                extraPricePerKm: formData.livraison.extraPricePerKm,
                deliveryDays: formData.livraison.deliveryDays,
                orderCutoffTime: formData.livraison.orderCutoffTime
            }
        };

        return this.api.post<any>(`${this.endpoint}/submit`, payload);
    }

    /**
     * Soumet l'inscription avec logo via FormData (multipart)
     */
    submitRegisterWithLogo(formData: StoreRegisterData, code: string): Observable<any> {
        const data = new FormData();

        data.append('code', code);
        data.append('manager', JSON.stringify({
            firstName: formData.manager.firstName,
            lastName: formData.manager.lastName,
            email: formData.manager.email,
            password: formData.manager.password
        }));
        data.append('boutique', JSON.stringify({
            name: formData.boutique.name,
            description: formData.boutique.description
        }));
        data.append('plan', JSON.stringify({
            type: formData.plan.type,
            box: formData.plan.box,
            lat: formData.plan.lat,
            lng: formData.plan.lng
        }));
        data.append('livraison', JSON.stringify({
            isDeliveryAvailable: formData.livraison.isDeliveryAvailable,
            minPrice: formData.livraison.minPrice,
            baseDistanceKm: formData.livraison.baseDistanceKm,
            extraPricePerKm: formData.livraison.extraPricePerKm,
            deliveryDays: formData.livraison.deliveryDays,
            orderCutoffTime: formData.livraison.orderCutoffTime
        }));

        if (formData.boutique.logo) {
            data.append('file', formData.boutique.logo, formData.boutique.logo.name);
        }

        return this.api.post<any>(`${this.endpoint}/submit`, data);
    }
}