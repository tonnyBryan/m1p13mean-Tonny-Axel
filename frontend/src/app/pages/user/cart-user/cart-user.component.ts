import { Component, OnInit } from '@angular/core';
import { CommandeService } from '../../../shared/services/commande.service';

@Component({
  selector: 'app-cart-user',
  imports: [],
  templateUrl: './cart-user.component.html',
  styleUrl: './cart-user.component.css',
})
export class CartUserComponent implements OnInit {
  constructor(private commandeService: CommandeService) {}

  ngOnInit(): void {
    this.loadFullDraft();
  }

  loadFullDraft() {
    this.commandeService.getDraftFull().subscribe({
      next: (res: any) => {
        console.log('Draft full response:', res);
        if (res?.success && res?.data) {
          console.log('Commande full data:', res.data);
        } else {
          console.log('No draft or empty result');
        }
      },
      error: (err: any) => {
        console.error('Error fetching draft full:', err);
      }
    });
  }
}
