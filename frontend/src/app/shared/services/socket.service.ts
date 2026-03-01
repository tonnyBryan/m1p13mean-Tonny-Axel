import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import {Observable, Subject} from "rxjs";
import {ToastService} from "./toast.service";


@Injectable({ providedIn: 'root' })
export class SocketService {
    private socket!: Socket;
    private notificationSubject = new Subject<any>();

    constructor(private toast: ToastService) {}

    notifications$: Observable<any> = this.notificationSubject.asObservable();

    connect(userId: string) {
        if (this.socket) return;

        this.socket = io(environment.baseUrl);

        this.socket.on('connect', () => {
            this.socket.emit('join', { userId });
        });

        this.socket.on('disconnect', () => {
        });

        this.socket.on('notification', (data) => {
            this.notificationSubject.next(data);
            this.toast.info(data.title, data.message);
        });
    }

    onNotification(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.off('notification'); // nettoie avant
        this.socket.on('notification', callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null as any;
        }
    }
}
