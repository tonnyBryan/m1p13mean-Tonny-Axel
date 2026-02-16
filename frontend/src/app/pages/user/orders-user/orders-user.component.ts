import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { Router } from '@angular/router';
import { CommandeService } from '../../../shared/services/commande.service';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from '../../../shared/components/form/date-picker/date-picker.component';
import { SelectComponent } from '../../../shared/components/form/select/select.component';

@Component({
  selector: 'app-orders-user',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent, ButtonComponent, FormsModule, DatePickerComponent, SelectComponent],
  templateUrl: './orders-user.component.html',
  styleUrls: ['./orders-user.component.css']
})
export class OrdersUserComponent implements OnInit {
  // pagination
  Math = Math;
  itemsPerPage = 10;
  currentPage = 1;
  totalDocs = 0;
  totalPages = 0;

  orders: any[] = [];
  loading = false;
  error = '';

  // filters
  searchTerm = '';
  statusFilter = 'all';

  // date filters
  startDate: string = '';
  endDate: string = '';

  // sort option
  sortOption: string = '-createdAt'; // default: date desc

  // options for app-select
  sortOptions = [
    { value: '-createdAt', label: 'Date (newest)' },
    { value: 'createdAt', label: 'Date (oldest)' },
    { value: '-totalAmount', label: 'Total (high to low)' },
    { value: 'totalAmount', label: 'Total (low to high)' }
  ];

  constructor(protected router: Router, private commandeService: CommandeService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(params: any = {}): void {
    this.loading = true;
    this.error = '';

    params.page = this.currentPage;
    params.limit = this.itemsPerPage;

    // map sortOption to params.sort
    params.sort = this.sortOption || '-createdAt';

    // Request only necessary fields via advancedResults fields param
    params.fields = 'boutique,deliveryMode,deliveryAddress,paymentMethod,status,totalAmount,createdAt';

    if (this.searchTerm) {
      const term = this.searchTerm.trim();
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (objectIdRegex.test(term)) {
        // search by exact id
        params['_id'] = term;
      }
      // else: no boutique.name filter — search by id only as requested
    }

    if (this.statusFilter !== 'all') {
      params.status = this.statusFilter;
    }

    // date filtering using advancedResults operators
    if (this.startDate) {
      params['createdAt[gte]'] = this.startDate;
    }
    if (this.endDate) {
      params['createdAt[lte]'] = this.endDate;
    }

    this.commandeService.getOrders(params).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          this.orders = res.data.items || [];
          console.log(this.orders);
          const pagination = res.data.pagination || { page: 1, totalDocs: 0, totalPages: 0 };
          this.currentPage = pagination.page || 1;
          this.totalDocs = pagination.totalDocs || 0;
          this.totalPages = pagination.totalPages || 0;
        } else {
          this.orders = res?.data ?? res ?? [];
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'Error loading orders';
        console.error('Error loading orders:', err);
      }
    });
  }

  getTotalSpent(): number {
    return this.orders.reduce((total, order) => total + (order.totalAmount || 0), 0);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadOrders();
  }

  onStatusFilterChange(filter: string): void {
    this.statusFilter = filter;
    this.currentPage = 1;
    this.loadOrders();
  }

  onDateChange(key: string, event: any): void {
    if (event && event.dateStr !== undefined) {
      if (key === 'startDate') this.startDate = event.dateStr;
      if (key === 'endDate') this.endDate = event.dateStr;
      this.currentPage = 1;
      this.loadOrders();
    }
  }

  onSortChange(value: string): void {
    this.sortOption = value;
    this.currentPage = 1;
    this.loadOrders();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  // computed properties for template
  protected pageTitle: string = 'Orders';
  get startIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalDocs);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadOrders();
    }
  }

  viewOrder(orderId: string): void {
    this.router.navigate(['/v1/orders', orderId]);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
