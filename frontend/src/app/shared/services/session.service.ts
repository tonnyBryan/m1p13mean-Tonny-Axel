import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class SessionService {
    private userSubject = new BehaviorSubject<any | null>(null);
    user$ = this.userSubject.asObservable();

    setUser(user: any | null) {
        this.userSubject.next(user);
    }

    clear() {
        this.userSubject.next(null);
    }

    updateAvatar(avatar: string) {
        const user = this.currentUser;
        if (user) {
            this.userSubject.next({ ...user, avatar });
        }
    }

    get currentUser(): any | null {
        return this.userSubject.value;
    }
}
