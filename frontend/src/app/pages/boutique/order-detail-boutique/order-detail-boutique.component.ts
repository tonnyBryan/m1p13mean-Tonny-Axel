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

  // --- Call API to change status ---
  private performStatusChange(apiCall: any, key: string, successMsg: string): void {
    this.actionLoading[key] = true;
    apiCall.subscribe({
      next: (res: any) => {
        this.actionLoading[key] = false;
        if (res?.success) {
          // backend returns commande in res.data or res
          this.order = res.data || res;
          this.toast.success('Success', successMsg);
        } else {
          const msg = res?.message || 'Failed to update order status';
          this.toast.error('Error', msg);
        }
      },
      error: (err: any) => {
        this.actionLoading[key] = false;
        const msg = err?.error?.message || err?.message || 'An error occurred while updating order status';
        this.toast.error('Error', msg);
        console.error('Status change error:', err);
      }
    });
  }

  // paid → accepted
  acceptOrder(): void {
    if (!this.order || !this.order._id) return;
    this.performStatusChange(this.commandeService.acceptOrder(this.order._id), 'accept', 'Order accepted successfully');
  }

  // paid → canceled (refund)
  cancelOrder(): void {
    if (!this.order || !this.order._id) return;
    this.performStatusChange(this.commandeService.cancelOrder(this.order._id), 'cancel', `Order canceled. Customer refunded ${this.order.totalAmount?.toLocaleString() || 0} Ar`);
  }

  // accepted → delivering
  startDelivery(): void {
    if (!this.order || !this.order._id) return;
    this.performStatusChange(this.commandeService.startDelivery(this.order._id), 'deliver', 'Delivery started');
  }

  // accepted → success (pickup)
  markAsPickedUp(): void {
    if (!this.order || !this.order._id) return;
    this.performStatusChange(this.commandeService.markAsPickedUp(this.order._id), 'pickup', 'Order marked as picked up');
  }

  // delivering → success
  markAsDelivered(): void {
    if (!this.order || !this.order._id) return;
    this.performStatusChange(this.commandeService.markAsDelivered(this.order._id), 'delivered', 'Order marked as delivered');
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