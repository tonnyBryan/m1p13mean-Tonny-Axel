import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { Boutique } from "../../../core/models/boutique.model";
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../shared/services/boutique.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-boutique-list',
  standalone: true,
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    FormsModule
  ],
  templateUrl: './boutique-list.component.html',
  styleUrls: ['./boutique-list.component.css']
})
export class BoutiqueListComponent implements OnInit {
  pageTitle = 'Shops Management';

  // Expose Math to template
  Math = Math;
  itemsPerPage = 10;
  currentPage = 1;
  totalDocs = 0;
  totalPages = 0;
  boutiques: Boutique[] = [];
  isLoading = false;

  // Stats
  stats = {
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0
  };


  // Filters
  searchTerm = '';
  statusFilter = 'all'; // all, active, inactive, validated, pending

  constructor(
    private router: Router,
    private boutiqueService: BoutiqueService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadBoutiques();
    this.loadStats();
  }

  loadStats(): void {
    this.boutiqueService.getBoutiqueStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
        }
      },
      error: (err) => {
        console.error('Error loading stats:', err);
      }
    });
  }

  loadBoutiques(): void {
    this.isLoading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sort: '-createdAt'
    };

    if (this.searchTerm) {
      // Assuming backend supports 'search' param or we filter by name using regex
      // advancedResults middleware supports regex if we format it right?
      // Or we can just use simple field match if advancedResults supports it.
      // advancedResults logic: matches fields.
      // If we want partial match on name: name[regex]=term&name[options]=i
      params['name[regex]'] = this.searchTerm;
      params['name[options]'] = 'i';
    }

    if (this.statusFilter !== 'all') {
      if (this.statusFilter === 'active') {
        params.isActive = true;
        params.isValidated = true;
      } else if (this.statusFilter === 'inactive') {
        params.isActive = false;
      } else if (this.statusFilter === 'validated') {
        params.isValidated = true;
      } else if (this.statusFilter === 'pending') {
        params.isValidated = false;
        // params.isActive = true; // Optional context
      }
    }

    this.boutiqueService.getBoutiques(params).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.boutiques = res.data.items;
          const pagination = res.data.pagination;
          this.currentPage = pagination.page;
          this.totalDocs = pagination.totalDocs;
          this.totalPages = pagination.totalPages;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error loading boutiques:', err);
      }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadBoutiques();
  }

  onFilterChange(filter: string): void {
    this.statusFilter = filter;
    this.currentPage = 1;
    this.loadBoutiques();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadBoutiques();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBoutiques();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadBoutiques();
    }
  }

  addBoutique(): void {
    this.router.navigate(['/admin/app/boutiques/add']);
  }

  editBoutique(boutique: Boutique): void {
    this.router.navigate(['/admin/app/boutiques', boutique._id]);
  }

  async deleteBoutique(boutique: Boutique): Promise<void> {
    const confirmed = await this.toast.confirmAsync(
      'Delete Shop',
      `Are you sure you want to delete "${boutique.name}"?`,
      { variant: 'danger' }
    );

    if (confirmed) {
      // TODO: Implement delete service
      this.toast.info('Feature Coming Soon', 'Delete functionality is not yet implemented.');
    }
  }

  getStatusColor(isActive: boolean, isValidated: boolean): string {
    if (!isActive) return 'danger';
    if (!isValidated) return 'warning';
    return 'success';
  }

  getStatusBgColor(isActive: boolean, isValidated: boolean): string {
    if (!isActive) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (!isValidated) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  }

  getStatusText(isActive: boolean, isValidated: boolean): string {
    if (!isActive) return 'Inactive';
    if (!isValidated) return 'Pending';
    return 'Active';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  get totalActiveBoutiques(): number { return this.stats.active; }
  get totalInactiveBoutiques(): number { return this.stats.inactive; }
  get totalPendingBoutiques(): number { return this.stats.pending; }
}
