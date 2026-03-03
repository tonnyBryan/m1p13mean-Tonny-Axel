import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicationService } from '../../../../shared/services/publication.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Router, ActivatedRoute } from '@angular/router';


interface Publication {
  _id: string;
  content: string;
  images: string[];
  type: string | null;
  status: 'published' | 'pending' | 'rejected';
  rejectedReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: { name: string; email: string };
  boutique: { _id: string; name: string; logo: string } | null;
}

interface ImagePreview {
  file: File;
  url: string;
}

type Tab = 'published' | 'pending' | 'rejected';

@Component({
  selector: 'app-publication-list-boutique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publication-list-boutique.component.html',
})
export class PublicationListBoutiqueComponent implements OnInit, OnDestroy {

  // ─── Data ─────────────────────────────────────────────────────────────────
  allPublications:       Publication[] = [];
  loading    = false;
  error: string | null   = null;

  activeTab: Tab = 'published';

  // ─── Delete ───────────────────────────────────────────────────────────────
  deleteLoadingId: string | null = null;

  // ─── Edit modal ───────────────────────────────────────────────────────────
  editModalOpen        = false;
  editingPub:          Publication | null = null;
  editContent          = '';
  editSelectedType:    string | null = null;
  editImages:          ImagePreview[] = [];   // nouvelles images ajoutées
  editExistingImages:  string[] = [];          // URLs déjà uploadées
  editIsDragging       = false;
  editLoading          = false;
  editError:           string | null = null;
  editCharCount        = 0;

  // ─── Lightbox ─────────────────────────────────────────────────────────────
  lightboxImages: string[] = [];
  lightboxIndex  = 0;
  lightboxOpen   = false;

  readonly MAX_CHARS  = 2000;
  readonly MAX_IMAGES = 10;

  readonly types = [
    { value: 'announcement', label: 'Announcement', icon: '📢', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' },
    { value: 'promotion',    label: 'Promotion',    icon: '🏷️', color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' },
    { value: 'new_arrival',  label: 'New Arrival',  icon: '✨', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' },
    { value: 'event',        label: 'Event',        icon: '🎉', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' },
  ];

  readonly typeConfig: Record<string, { label: string; icon: string; cls: string }> = {
    announcement: { label: 'Announcement', icon: '📢', cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    promotion:    { label: 'Promotion',    icon: '🏷️', cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
    new_arrival:  { label: 'New Arrival',  icon: '✨', cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    event:        { label: 'Event',        icon: '🎉', cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  };

  constructor(
      private publicationService: PublicationService,
      private router: Router,
      private toast: ToastService,
      private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.load();
    const tab = this.route.snapshot.queryParamMap.get('tab') as Tab;
    if (tab && ['published', 'pending', 'rejected'].includes(tab)) {
      this.activeTab = tab;
    }
  }

  ngOnDestroy(): void {
    this.editImages.forEach(img => URL.revokeObjectURL(img.url));
  }

  // ─── Load ─────────────────────────────────────────────────────────────────

  load(): void {
    this.loading = true;
    this.error   = null;
    this.publicationService.getMyPublications().subscribe({
      next: (res) => {
        this.allPublications = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.error   = 'Unable to load your publications.';
        this.loading = false;
      }
    });
  }

  // ─── Tab ──────────────────────────────────────────────────────────────────

  switchTab(tab: Tab): void { this.activeTab = tab; }

  get currentList(): Publication[] {
    return this.allPublications.filter(p => p.status === this.activeTab);
  }

  countOf(tab: Tab): number {
    return this.allPublications.filter(p => p.status === tab).length;
  }

  // ─── Navigate ─────────────────────────────────────────────────────────────

  goCreate(): void { this.router.navigate(['/store/app/publications/add']); }

  // ─── Delete ───────────────────────────────────────────────────────────────

  askDelete(pub: Publication): void {
    const label = this.truncate(pub.content, 60);
    this.toast.confirm(
        'Delete publication?',
        `Are you sure you want to delete "${label}"?`,
        () => this.confirmDelete(pub._id),
        () => {},
        { confirmLabel: 'Delete', cancelLabel: 'Keep it', variant: 'danger', position: 'top-center', backdrop: true }
    );
  }

  confirmDelete(id: string): void {
    this.deleteLoadingId = id;
    this.publicationService.deletePublication(id).subscribe({
      next: () => {
        this.allPublications = this.allPublications.filter(p => p._id !== id);
        this.deleteLoadingId = null;
      },
      error: () => { this.deleteLoadingId = null; }
    });
  }

  // ─── Edit modal ───────────────────────────────────────────────────────────

  openEditModal(pub: Publication): void {
    this.editingPub         = pub;
    this.editContent        = pub.content;
    this.editSelectedType   = pub.type;
    this.editExistingImages = [...pub.images];
    this.editImages         = [];
    this.editCharCount      = pub.content.length;
    this.editError          = null;
    this.editLoading        = false;
    this.editModalOpen      = true;
  }

  closeEditModal(): void {
    this.editImages.forEach(img => URL.revokeObjectURL(img.url));
    this.editImages    = [];
    this.editModalOpen = false;
    this.editingPub    = null;
    this.editError     = null;
  }

  selectEditType(value: string): void {
    this.editSelectedType = this.editSelectedType === value ? null : value;
  }

  onEditContentChange(value: string): void { this.editCharCount = value.length; }

  // Drag & drop dans le modal edit
  onEditDragOver(e: DragEvent): void { e.preventDefault(); this.editIsDragging = true; }
  onEditDragLeave(): void { this.editIsDragging = false; }

  onEditDrop(e: DragEvent): void {
    e.preventDefault();
    this.editIsDragging = false;
    this.addEditFiles(Array.from(e.dataTransfer?.files ?? []));
  }

  onEditFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.addEditFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  addEditFiles(files: File[]): void {
    const totalExisting = this.editExistingImages.length + this.editImages.length;
    const remaining     = this.MAX_IMAGES - totalExisting;
    const toAdd         = files.filter(f => f.type.startsWith('image/')).slice(0, remaining);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => this.editImages.push({ file, url: ev.target?.result as string });
      reader.readAsDataURL(file);
    });
    if (files.length > remaining) {
      this.editError = `Maximum ${this.MAX_IMAGES} images allowed.`;
      setTimeout(() => this.editError = null, 3000);
    }
  }

  removeExistingImage(index: number): void { this.editExistingImages.splice(index, 1); }
  removeNewImage(index: number): void {
    URL.revokeObjectURL(this.editImages[index].url);
    this.editImages.splice(index, 1);
  }

  get editTotalImages(): number { return this.editExistingImages.length + this.editImages.length; }

  get editImageGridClass(): string {
    const n = this.editTotalImages;
    if (n === 1) return 'grid-cols-1';
    if (n === 2) return 'grid-cols-2';
    return 'grid-cols-3';
  }

  get isEditValid(): boolean {
    return this.editContent.trim().length >= 3 && this.editContent.length <= this.MAX_CHARS;
  }

  submitEdit(): void {
    if (!this.isEditValid || this.editLoading || !this.editingPub) return;
    this.editLoading = true;
    this.editError   = null;

    // On supprime et recrée — status repassera à pending automatiquement (backend gère le rôle)
    const id = this.editingPub._id;

    // 1. Supprimer l'ancienne
    this.publicationService.deletePublication(id).subscribe({
      next: () => {
        // 2. Créer la nouvelle (status = pending côté backend car role boutique)
        const formData = new FormData();
        formData.append('content', this.editContent.trim());
        if (this.editSelectedType) formData.append('type', this.editSelectedType);
        // Anciennes images conservées envoyées comme URLs (si le backend le supporte)
        // Sinon on envoie seulement les nouvelles
        this.editImages.forEach(img => formData.append('images', img.file));

        this.publicationService.createPublication(formData).subscribe({
          next: (res) => {
            // Remplacer dans la liste
            this.allPublications = this.allPublications.filter(p => p._id !== id);
            if (res.data) this.allPublications.unshift(res.data);
            this.activeTab  = 'pending';
            this.editLoading = false;
            this.closeEditModal();
          },
          error: (err) => {
            this.editError   = err?.error?.message ?? 'An error occurred.';
            this.editLoading = false;
          }
        });
      },
      error: () => {
        this.editError   = 'Failed to update. Please try again.';
        this.editLoading = false;
      }
    });
  }

  // ─── Lightbox ─────────────────────────────────────────────────────────────

  openLightbox(images: string[], index: number): void {
    this.lightboxImages = images; this.lightboxIndex = index; this.lightboxOpen = true;
  }
  closeLightbox(): void { this.lightboxOpen = false; }
  prevImage(): void { this.lightboxIndex = (this.lightboxIndex - 1 + this.lightboxImages.length) % this.lightboxImages.length; }
  nextImage(): void { this.lightboxIndex = (this.lightboxIndex + 1) % this.lightboxImages.length; }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  truncate(text: string, max = 120): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
}