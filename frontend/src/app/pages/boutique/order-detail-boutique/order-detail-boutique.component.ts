import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router";
import { CommandeService } from "../../../shared/services/commande.service";
import { ToastService } from "../../../shared/services/toast.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { PageBreadcrumbComponent } from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {CentreService} from "../../../shared/services/centre.service";

@Component({
  selector: 'app-orders-detail-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule, PageBreadcrumbComponent],
  templateUrl: './order-detail-boutique.component.html',
  styleUrl: './order-detail-boutique.component.css',
})
export class OrderDetailBoutiqueComponent implements OnInit {
  centre: any = null;

  orderId: string | null = null;
  order: any = null;
  loading = false;

  // Action loading states
  actionLoading: { [key: string]: boolean } = {};

  // Canceled reason
  cancelReason: string = '';
  showCancelReasonForm = false;

  saleId: string | null = null;

  constructor(
      private route: ActivatedRoute,
      protected router: Router,
      private commandeService: CommandeService,
      private centreService: CentreService,
      private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.orderId = id;
        this.loadOrder(id);
        this.loadCentre();
      } else {
        this.toast.error('Error', 'Missing order identifier in the URL.');
        this.router.navigate(['/store/app/orders']);
      }
    });
  }


  loadCentre(): void {
    this.centreService.getCentreCommercial().subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.centre = res.data;
        } else {
          this.centre = null;
        }
      },
      error: (err) => {
        console.error('Error loading centre commercial', err);
        this.centre = null;
      }
    });
  }



  loadOrder(id: string) {
    this.loading = true;
    this.commandeService.getOrderById(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          this.order = res.data || res;
          this.saleId = this.order.saleId;
          this.cancelReason = this.order?.reasonCancellation || '';
          this.showCancelReasonForm = false;
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

  openGoogleMapsRoute(): void {
    if (!this.centre?.location?.coordinates || !this.order?.deliveryAddress) {
      this.toast.error('Error', 'Missing coordinates for route calculation');
      return;
    }

    const origin = `${this.centre.location.coordinates.latitude},${this.centre.location.coordinates.longitude}`;
    const destination = `${this.order.deliveryAddress.latitude},${this.order.deliveryAddress.longitude}`;

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    window.open(mapsUrl, '_blank');
  }

  // --- Call API to change status ---
  private performStatusChange(apiCall: any, key: string, successMsg: string): void {
    this.actionLoading[key] = true;
    apiCall.subscribe({
      next: (res: any) => {
        this.actionLoading[key] = false;
        if (res?.success) {
          if (key === 'accept') {
            this.order.status = res.data.order.status;
            this.saleId = res.data.saleId;
          } else {
            this.order.status = res.data.status;
          }
          if (key === 'cancel' && this.order?.reasonCancellation) {
            this.cancelReason = this.order.reasonCancellation;
            this.showCancelReasonForm = false;
          }
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
    this.showCancelReasonForm = true;
  }

  submitCancelReason(): void {
    if (!this.order || !this.order._id) return;
    this.toast.confirm(
        'Confirm Cancellation',
        `This will cancel the order and refund the customer ${this.order.totalAmount?.toLocaleString() || 0} Ar. Continue?`,
        () => {
          const reason = this.cancelReason?.trim();
          this.performStatusChange(
              this.commandeService.cancelOrder(this.order._id, reason || null),
              'cancel',
              `Order canceled. Customer refunded ${this.order.totalAmount?.toLocaleString() || 0} Ar`
          );
        },
        () => {},
        {
          confirmLabel: 'Yes, cancel order',
          cancelLabel: 'Keep order',
          variant: 'danger',
          position: 'top-center',
          backdrop: true,
        }
    );
  }

  // accepted → delivering
  startDelivery(): void {
    if (!this.order || !this.order._id) return;
    if (this.order.deliveryMode === 'pickup') return;
    this.performStatusChange(this.commandeService.startDelivery(this.order._id), 'deliver', 'Delivery started');
  }

  // accepted → success (pickup)
  markAsPickedUp(): void {
    if (!this.order || !this.order._id) return;

    if (this.order.deliveryMode === 'delivery') {
      this.toast.confirm(
          'Confirm Pickup',
          'This order is set for delivery. Are you sure the customer picked it up in-store?',
          () => {
            this.performStatusChange(
                this.commandeService.markAsPickedUp(this.order._id),
                'pickup',
                'Order marked as picked up'
            );
          },
          () => {},
          {
            confirmLabel: 'Yes, picked up',
            cancelLabel: 'Cancel',
            variant: 'primary',
            position: 'top-center',
            backdrop: true,
          }
      );
    } else {
      this.performStatusChange(
          this.commandeService.markAsPickedUp(this.order._id),
          'pickup',
          'Order marked as picked up'
      );
    }
  }

  // delivering → success
  markAsDelivered(): void {
    if (!this.order || !this.order._id) return;
    this.performStatusChange(this.commandeService.markAsDelivered(this.order._id), 'delivered', 'Order marked as delivered');
  }

  // Navigate to related sale
  viewRelatedSale(): void {
    this.router.navigate(['/store/app/vente-liste', this.saleId]);
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

  hasInsufficientStock(item: any): boolean {
    const stock = Number(item?.product?.stock ?? 0);
    const qty = Number(item?.quantity ?? 0);
    return stock < qty;
  }

  get hasAnyInsufficientStock(): boolean {
    return Array.isArray(this.order?.products) && this.order.products.some((item: any) => this.hasInsufficientStock(item));
  }

  get anyActionLoading(): boolean {
    return Object.values(this.actionLoading).some(v => v);
  }
}
