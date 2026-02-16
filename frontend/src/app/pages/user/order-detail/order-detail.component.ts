import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CommandeService } from '../../../shared/services/commande.service';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  orderId: string | null = null;
  order: any = null;
  loading = false;
  error = '';

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private commandeService: CommandeService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (this.orderId) {
      this.loadOrder(this.orderId);
    } else {
      this.error = 'Order ID missing';
    }
  }

  loadOrder(id: string) {
    this.loading = true;
    this.error = '';
    this.commandeService.getOrderById(id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          this.order = res.data || res;
          console.log('Order:', this.order);
        } else {
          this.order = res?.data ?? res ?? null;
          if (!this.order) this.error = 'Order not found';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'Error loading order';
        console.error('Error loading order:', err);
      }
    });
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusInfo(status: string): { label: string; description: string; icon: string; color: string } {
    const statusMap: any = {
      'paid': {
        label: 'Payment Confirmed',
        description: 'Your payment has been received and confirmed. The store will process your order soon.',
        icon: 'check-circle',
        color: 'emerald'
      },
      'accepted': {
        label: 'Order Accepted',
        description: 'The store has accepted your order and is preparing it for delivery or pickup.',
        icon: 'badge-check',
        color: 'blue'
      },
      'delivering': {
        label: 'Out for Delivery',
        description: 'Your order is on its way! The delivery is in progress.',
        icon: 'truck',
        color: 'amber'
      },
      'success': {
        label: 'Order Delivered',
        description: 'Your order has been successfully delivered. Enjoy your purchase!',
        icon: 'thumbs-up',
        color: 'purple'
      },
      'canceled': {
        label: 'Order Canceled',
        description: 'This order has been canceled and you have been refunded.',
        icon: 'x-circle',
        color: 'red'
      }
    };
    return statusMap[status] || statusMap['paid'];
  }

  goBack(): void {
    this.router.navigate(['/v1/orders']);
  }
}