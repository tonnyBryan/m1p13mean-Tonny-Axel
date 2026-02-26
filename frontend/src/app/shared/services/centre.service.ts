import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CentreService {
  constructor(private api: ApiService) {}

  // GET /api/centre-commercial
  getCentreCommercial(): Observable<any> {
    return this.api.get('centre-commercial');
  }
}
