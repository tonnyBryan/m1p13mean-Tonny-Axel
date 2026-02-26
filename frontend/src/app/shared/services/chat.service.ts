// chat/chat.service.ts

import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ChatHistoryResponse, ChatResponse } from '../../core/models/chat.models';
import {ApiService} from "./api.service";
import {AuthService} from "./auth.service";

interface ApiResponse<T> {
    success: boolean;
    message: string | null;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {

    private readonly endpoint = 'chat';

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) {}

    /** Headers avec token */
    private getAuthHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    sendMessage(message: string): Observable<ChatResponse> {
        return this.api
            .post<ApiResponse<ChatResponse>>(
                `${this.endpoint}/message`,
                { message },
                this.getAuthHeaders()
            )
            .pipe(map(res => res.data));
    }

    getHistory(): Observable<ChatHistoryResponse> {
        return this.api
            .get<ApiResponse<ChatHistoryResponse>>(
                `${this.endpoint}/history`,
                this.getAuthHeaders()
            )
            .pipe(map(res => res.data));
    }

    clearHistory(): Observable<void> {
        return this.api
            .delete<ApiResponse<void>>(
                `${this.endpoint}/history`,
                this.getAuthHeaders()
            )
            .pipe(map(() => void 0));
    }
}