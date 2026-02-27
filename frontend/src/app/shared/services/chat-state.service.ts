// chat/chat-state.service.ts
// Singleton service — shared state between popup widget and full page.
// Both components subscribe to the same messages$ and isLoading$.

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {ChatMessage, ChatResponse} from "../../core/models/chat.models";
import {ChatService} from "./chat.service";

@Injectable({ providedIn: 'root' })
export class ChatStateService {

    private _messages  = new BehaviorSubject<ChatMessage[]>([]);
    private _isLoading = new BehaviorSubject<boolean>(false);
    private _isLoadingHistory = new BehaviorSubject<boolean>(false);
    private _initialized = false;

    readonly messages$        = this._messages.asObservable();
    readonly isLoading$       = this._isLoading.asObservable();
    readonly isLoadingHistory$ = this._isLoadingHistory.asObservable();

    constructor(private chatService: ChatService) {}

    get hasMessages(): boolean {
        return this._messages.getValue().length > 0;
    }

    get isLoading(): boolean {
        return this._isLoading.getValue();
    }

    get messages(): ChatMessage[] {
        return this._messages.getValue();
    }

    /** Load history from DB — only once per session unless forced */
    loadHistory(force = false) {
        if (this._initialized && !force) return;
        this._isLoadingHistory.next(true);
        this.chatService.getHistory().subscribe({
            next: (res) => {
                this._messages.next(res.messages.map(m => ({ ...m })));
                this._isLoadingHistory.next(false);
                this._initialized = true;
            },
            error: () => {
                this._isLoadingHistory.next(false);
                this._initialized = true;
            }
        });
    }

    /** Send a message — updates state immediately, response updates async */
    send(text: string): void {
        const msg = text.trim();
        if (!msg || this._isLoading.getValue()) return;

        this._isLoading.next(true);

        // Push user message
        const current = this._messages.getValue();
        const withUser: ChatMessage[] = [
            ...current,
            { role: 'user', content: msg, createdAt: new Date().toISOString() }
        ];

        // Push loading placeholder
        const loadingIndex = withUser.length;
        const withLoading: ChatMessage[] = [
            ...withUser,
            { role: 'assistant', content: '', isLoading: true }
        ];
        this._messages.next(withLoading);

        // Call API
        this.chatService.sendMessage(msg).subscribe({
            next: (response: ChatResponse) => {
                const msgs = [...this._messages.getValue()];
                msgs[loadingIndex] = {
                    role: 'assistant',
                    content: response.summary || '',
                    structuredResponse: response,
                    createdAt: new Date().toISOString(),
                    isLoading: false,
                };
                this._messages.next(msgs);
                this._isLoading.next(false);
            },
            error: () => {
                const msgs = [...this._messages.getValue()];
                msgs[loadingIndex] = {
                    role: 'assistant',
                    content: 'An error occurred. Please try again.',
                    structuredResponse: {
                        type: 'text', lang: 'en', title: '', summary: '',
                        data: { message: 'An error occurred. Please try again.', variant: 'error' },
                        actions: []
                    },
                    isLoading: false,
                    createdAt: new Date().toISOString(),
                };
                this._messages.next(msgs);
                this._isLoading.next(false);
            }
        });
    }

    clearHistory() {
        return this.chatService.clearHistory().subscribe({
            next: () => {
                this._messages.next([]);
                this._initialized = false;
            }
        });
    }
}