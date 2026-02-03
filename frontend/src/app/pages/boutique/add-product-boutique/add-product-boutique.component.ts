import {Component, OnInit} from '@angular/core';
import {NgClass} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {LabelComponent} from "../../../shared/components/form/label/label.component";
import {InputFieldComponent} from "../../../shared/components/form/input/input-field.component";
import {StoreService} from "../../../shared/services/store.service";
import {Router} from "@angular/router";
import {ButtonComponent} from "../../../shared/components/ui/button/button.component";
import {ERROR_MESSAGES} from "../../../core/constants/error-messages";


@Component({
    selector: 'add-product-boutique',
    imports: [
        NgClass,
        FormsModule,
        LabelComponent,
        InputFieldComponent,
        ButtonComponent,
    ],
    templateUrl: './add-product-boutique.component.html',
    styles: ``
})
export class AddProductBoutiqueComponent implements OnInit  {

    constructor(
        private storeService: StoreService,
        private router: Router
    ) {}

    // ── Form Fields ───────────────────────────
    name: string = '';
    description: string = '';
    regularPrice: number | null = null;
    salePrice: number | null = null;

    // ── Tags ──────────────────────────────────
    tags: string[] = [];
    currentTag: string = '';

    // ── Images ────────────────────────────────
    imageUrls: string[] = [];
    previewImages: { url: string; source: 'file' | 'url' }[] = [];
    isDragActive: boolean = false;

    // ── Validation ────────────────────────────
    submitted: boolean = false;
    isLoading = false;

    createIcon = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n" +
        "              <path d=\"M2 8.5L6.5 13L14 3\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n" +
        "            </svg>"


    ngOnInit(): void {}

    // ════════════════════════════════════════════
    //  TAGS
    // ════════════════════════════════════════════
    addTag(): void {
        const trimmed = this.currentTag.trim().toLowerCase();
        if (trimmed && !this.tags.includes(trimmed)) {
            this.tags.push(trimmed);
        }
        this.currentTag = '';
    }

    onTagKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            this.addTag();
        }
    }

    removeTag(index: number): void {
        this.tags.splice(index, 1);
    }

    // ════════════════════════════════════════════
    //  IMAGES – Drag & Drop + File Select
    // ════════════════════════════════════════════
    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragActive = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragActive = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragActive = false;
        if (event.dataTransfer?.files) {
            this.processFiles(event.dataTransfer.files);
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            this.processFiles(input.files);
        }
        input.value = '';
    }

    private processFiles(files: FileList): void {
        Array.from(files).forEach(file => {
            if (file.type.match(/image\/(png|jpeg|webp|svg\+xml)/)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const url = e.target?.result as string;
                    this.previewImages.push({ url, source: 'file' });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ── URL manuelle ──────────────────────────
    currentImageUrl: string = '';

    addImageUrl(): void {
        const trimmed = this.currentImageUrl.trim();
        if (trimmed && !this.previewImages.some(img => img.url === trimmed)) {
            this.previewImages.push({ url: trimmed, source: 'url' });
            this.imageUrls.push(trimmed);
        }
        this.currentImageUrl = '';
    }

    onImageUrlKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.addImageUrl();
        }
    }

    removeImage(index: number): void {
        const removed = this.previewImages[index];
        if (removed.source === 'url') {
            const urlIndex = this.imageUrls.indexOf(removed.url);
            if (urlIndex > -1) this.imageUrls.splice(urlIndex, 1);
        }
        this.previewImages.splice(index, 1);
    }

    // ════════════════════════════════════════════
    //  COMPUTED
    // ════════════════════════════════════════════
    get discountPercent(): number | null {
        if (this.regularPrice && this.salePrice && this.regularPrice > this.salePrice) {
            return Math.round(((this.regularPrice - this.salePrice) / this.regularPrice) * 100);
        }
        return null;
    }

    get isFormValid(): boolean {
        return (
            this.name.trim().length > 0 &&
            this.description.trim().length > 0 &&
            this.regularPrice !== null &&
            this.regularPrice > 0 &&
            this.previewImages.length > 0
        );
    }

    // ════════════════════════════════════════════
    //  SUBMIT
    // ════════════════════════════════════════════
    onSubmit(): void {
        this.submitted = true;
        if (!this.isFormValid) return;

        this.isLoading = true;

        const product = {
            name: this.name.trim(),
            description: this.description.trim(),
            regularPrice: this.regularPrice,
            salePrice: this.salePrice,
            tags: this.tags,
            images: this.previewImages.map(img => img.url)
        };

        console.log('Product to save:', product);

        this.storeService.createProduct(product).subscribe({
            next: res => {
                this.isLoading = false;
                if (res.success) {
                    this.router.navigate(['/store/app/products']);
                } else {
                    alert(res.message);
                }
            },
            error: err => {
                this.isLoading = false;
                if (err.error && err.error.message) {
                    alert(err.error.message);
                } else {
                    alert(ERROR_MESSAGES.AUTH.IMPOSSIBLE_CONNECTION);
                }
            }
        });
    }

    onCancel(): void {
        this.name = '';
        this.description = '';
        this.regularPrice = null;
        this.salePrice = null;
        this.tags = [];
        this.currentTag = '';
        this.previewImages = [];
        this.imageUrls = [];
        this.currentImageUrl = '';
        this.submitted = false;
    }
}
