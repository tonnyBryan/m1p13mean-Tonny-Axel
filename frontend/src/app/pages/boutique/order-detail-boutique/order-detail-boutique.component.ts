import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { CommandeService } from "../../../shared/services/commande.service";
import { ToastService } from "../../../shared/services/toast.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PageBreadcrumbComponent } from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";

@Component({
  selector: 'app-orders-detail-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
  templateUrl: './order-detail-boutique.component.html',
  styleUrl: './order-detail-boutique.component.css',
})
export class OrderDetailBoutiqueComponent implements OnInit {

  orderId: string | null = null;
  order: any = null;
  loading = false;

  // Action loading states
  actionLoading: { [key: string]: boolean } = {};

  // Canceled reason
  cancelReason: string = '';

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private commandeService: CommandeService,
      private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      this.toast.error('Error', 'Missing id in url');
      this.router.navigate(['/store/app/orders']);
    }
  }

  loadOrder(id: string) {
    this.loading = true;
    this.commandeService.getOrderById(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          this.order = res.data || res;
          console.log('Order:', this.order);
        }
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || 'Error loading order';
        this.toast.error('Error', msg);
        this.router.navigate(['/store/app/orders']);
      }
    });
  }

  // --- Simulate 2s API call ---
  private simulateAction(key: string, newStatus: string, successMsg: string): void {
    this.actionLoading[key] = true;
    setTimeout(() => {
      this.actionLoading[key] = false;
      this.order.status = newStatus;
      this.toast.success('Success', successMsg);
    }, 2000);
  }

  // paid → accepted
  acceptOrder(): void {
    this.simulateAction('accept', 'accepted', 'Order accepted successfully');
  }

  // paid → canceled (refund)
  cancelOrder(): void {
    this.simulateAction('cancel', 'canceled', `Order canceled. Customer refunded ${this.order.totalAmount.toLocaleString()} Ar`);
  }

  // accepted → delivering
  startDelivery(): void {
    this.simulateAction('deliver', 'delivering', 'Delivery started');
  }

  // accepted → success (pickup)
  markAsPickedUp(): void {
    this.simulateAction('pickup', 'success', 'Order marked as picked up');
  }

  // delivering → success
  markAsDelivered(): void {
    this.simulateAction('delivered', 'success', 'Order marked as delivered');
  }

  // Navigate to related sale
  viewRelatedSale(): void {
    this.router.navigate(['/store/app/vente-liste'], {
      queryParams: { orderId: this.order._id }
    });
  }

  goBack(): void {
    this.router.navigate(['/store/app/orders']);
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  isActionLoading(key: string): boolean {
    return this.actionLoading[key] === true;
  }

  get anyActionLoading(): boolean {
    return Object.values(this.actionLoading).some(v => v);
  }
}