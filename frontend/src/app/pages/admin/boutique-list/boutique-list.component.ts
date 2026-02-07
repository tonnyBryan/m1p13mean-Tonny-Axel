import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { Boutique } from "../../../core/models/boutique.model";
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BoutiqueService } from '../../../shared/services/boutique.service';

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
  pageTitle = 'Boutiques Management';

  // Expose Math to template
  Math = Math;
  itemsPerPage = 2;
  currentPage = 1;
  totalDocs = 0;
  totalPages = 0;

  boutiques: Boutique[] = [];
  isLoading = false;

  // Filters
  searchTerm = '';
  statusFilter = 'all'; // all, active, inactive, validated, pending

  constructor(
    private router: Router,
    private boutiqueService: BoutiqueService
  ) { }

  ngOnInit(): void {
    this.loadBoutiques();
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
    // TODO: Navigate to edit boutique form
    console.log('Edit boutique:', boutique._id);
  }

  deleteBoutique(boutique: Boutique): void {
    if (confirm('Are you sure you want to delete this boutique?')) {
      // TODO: Implement delete service
      console.log('Delete boutique:', boutique._id);
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

  // Placeholder stats - would require separate API endpoints to be accurate now
  get totalActiveBoutiques(): number { return 0; }
  get totalValidatedBoutiques(): number { return 0; }
  get totalPendingBoutiques(): number { return 0; }
}
