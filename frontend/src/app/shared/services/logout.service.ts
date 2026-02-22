import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LogoutService {
    private _isLoggingOut = new BehaviorSubject<boolean>(false);
    isLoggingOut$ = this._isLoggingOut.asObservable();

    show() { this._isLoggingOut.next(true); }
    hide() { this._isLoggingOut.next(false); }
}