import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {PublicationService} from "../../../../shared/services/publication.service";

interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-publication-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-create.component.html',
})
export class PublicationCreateComponent implements OnDestroy {

  content = '';
  selectedType: string | null = null;
  images: ImagePreview[] = [];
  isDragging = false;
  loading = false;
  error: string | null = null;
  charCount = 0;
  readonly MAX_CHARS = 2000;
  readonly MAX_IMAGES = 10;

  readonly types = [
    { value: 'announcement', label: 'Announcement', icon: '📢', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' },
    { value: 'promotion',    label: 'Promotion',    icon: '🏷️', color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' },
    { value: 'new_arrival',  label: 'New Arrival',  icon: '✨', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' },
    { value: 'event',        label: 'Event',        icon: '🎉', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' },
  ];

  constructor(
      private publicationService: PublicationService,
      private router: Router
  ) {}

  onContentChange(value: string): void {
    this.charCount = value.length;
  }

  selectType(value: string): void {
    this.selectedType = this.selectedType === value ? null : value;
  }

  getTypeData(value: string | null) {
    return this.types.find(t => t.value === value) ?? null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.addFiles(files);
    input.value = '';
  }

  addFiles(files: File[]): void {
    const remaining = this.MAX_IMAGES - this.images.length;
    const toAdd = files.filter(f => f.type.startsWith('image/')).slice(0, remaining);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.images.push({ file, url: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    });
    if (files.length > remaining) {
      this.error = `Maximum ${this.MAX_IMAGES} images allowed.`;
      setTimeout(() => this.error = null, 3000);
    }
  }

  removeImage(index: number): void {
    this.images.splice(index, 1);
  }

  get isValid(): boolean {
    return this.content.trim().length >= 3 && this.content.length <= this.MAX_CHARS;
  }

  get imageGridClass(): string {
    const n = this.images.length;
    if (n === 1) return 'grid-cols-1';
    if (n === 2) return 'grid-cols-2';
    return 'grid-cols-3';
  }

  async submit(): Promise<void> {
    if (!this.isValid || this.loading) return;
    this.loading = true;
    this.error = null;

    const formData = new FormData();
    formData.append('content', this.content.trim());
    if (this.selectedType) formData.append('type', this.selectedType);
    this.images.forEach(img => formData.append('images', img.file));

    this.publicationService.createPublication(formData).subscribe({
      next: () => {
        this.router.navigate(['/admin/app/publications']);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'An error occurred.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/app/publications']);
  }

  ngOnDestroy(): void {
    this.images.forEach(img => URL.revokeObjectURL(img.url));
  }
}
