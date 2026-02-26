import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../shared/services/category.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-boutique-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutique-categories.component.html',
})
export class BoutiqueCategoriesComponent implements OnInit {

  categories: any[] = [];
  isLoading = true;
  isSaving = false;

  // Formulaire ajout
  newName = '';
  newDescription = '';
  showForm = false;

  isToggling: { [id: string]: boolean } = {};


  constructor(
      private categoryService: CategoryService,
      private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  toggleCategory(cat: any): void {
    if (this.isToggling[cat._id]) return;

    const action = cat.isActive ? 'deactivate' : 'activate';
    const title = cat.isActive ? 'Deactivate category?' : 'Activate category?';
    const message = cat.isActive
        ? `"${cat.name}" will be hidden. Active products using it must be reassigned first.`
        : `"${cat.name}" will be available again for products.`;

    this.toast.confirm(title, message,
        () => this.executeToggle(cat),
        () => {},
        {
          confirmLabel: cat.isActive ? 'Deactivate' : 'Activate',
          cancelLabel: 'Cancel',
          variant: cat.isActive ? 'danger' : 'success',
          position: 'top-center',
          backdrop: true,
        }
    );
  }

  private executeToggle(cat: any): void {
    this.isToggling[cat._id] = true;
    const call = cat.isActive
        ? this.categoryService.deactivateCategory(cat._id)
        : this.categoryService.activateCategory(cat._id);

    call.subscribe({
      next: (res) => {
        if (res.success) {
          cat.isActive = !cat.isActive;
          const msg = cat.isActive ? 'Category activated.' : 'Category deactivated.';
          this.toast.success('Done', msg, 3000);
        } else {
          this.toast.error('Error', res.message ?? 'Operation failed.');
        }
        this.isToggling[cat._id] = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Operation failed.');
        this.isToggling[cat._id] = false;
      }
    });
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories({ limit: 100, sort: 'name' }).subscribe({
      next: (res) => {
        if (res.success) {
          this.categories = res.data.items || [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to load categories.', 0);
        this.isLoading = false;
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  resetForm(): void {
    this.newName = '';
    this.newDescription = '';
  }

  isFormValid(): boolean {
    return this.newName.trim().length >= 2;
  }

  addCategory(): void {
    if (!this.isFormValid()) return;
    this.isSaving = true;
    this.categoryService.addCategory({
      name: this.newName.trim(),
      description: this.newDescription.trim() || undefined,
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.categories.push(res.data);
          this.categories.sort((a, b) => a.name.localeCompare(b.name));
          this.toast.success('Success', 'Category created successfully.', 3000);
          this.showForm = false;
          this.resetForm();
        } else {
          this.toast.error('Error', res.message ?? 'Failed to create category.', 0);
        }
        this.isSaving = false;
      },
      error: (err) => {
        this.toast.error('Error', err?.error?.message ?? 'Failed to create category.', 0);
        this.isSaving = false;
      }
    });
  }

  formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(date));
  }
}