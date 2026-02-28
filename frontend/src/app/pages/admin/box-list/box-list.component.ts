import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BoxService } from '../../../shared/services/box.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Box } from '../../../core/models/box.model';

@Component({
    selector: 'app-box-list',
    standalone: true,
    imports: [CommonModule, PageBreadcrumbComponent, FormsModule],
    templateUrl: './box-list.component.html',
    styleUrls: ['./box-list.component.css']
})
export class BoxListComponent implements OnInit {

    boxes: Box[] = [];
    statusFilter = 'all';
    isLoading = false;

    showModal = false;
    isEditing = false;
    currentBox: Partial<Box> = {};

    // Spinners par action
    isSaving = false;
    deletingId: string | null = null;

    filterOptions = [
        { value: 'all',    label: 'All Boxes' },
        { value: 'vide',   label: 'Available' },
        { value: 'occupe', label: 'Occupied' },
    ];

    constructor(
        private boxService: BoxService,
        private toast: ToastService,
        public router: Router
    ) {}

    ngOnInit(): void {
        this.loadBoxes();
    }

    loadBoxes(): void {
        this.isLoading = true;
        this.boxService.getBoxes(this.statusFilter).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success) this.boxes = res.data;
            },
            error: () => {
                this.isLoading = false;
                this.toast.error('Error', 'Unable to load boxes');
            }
        });
    }

    onFilterChange(status: string): void {
        this.statusFilter = status;
        this.loadBoxes();
    }

    openModal(box?: Box): void {
        this.isEditing = !!box;
        this.currentBox = box ? { ...box } : { number: '', pricePerMonth: 0 };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.currentBox = {};
        this.isSaving = false;
    }

    onSubmit(form: NgForm): void {
        if (form.invalid || this.isSaving) return;
        this.isSaving = true;

        if (this.isEditing && this.currentBox._id) {
            this.boxService.updateBox(this.currentBox._id, this.currentBox).subscribe({
                next: (res) => {
                    this.isSaving = false;
                    const idx = this.boxes.findIndex(b => b._id === this.currentBox._id);
                    if (idx !== -1) this.boxes[idx] = { ...this.boxes[idx], ...res.data };
                    this.toast.success('Success', 'Box updated');
                    this.closeModal();
                },
                error: (err) => {
                    this.isSaving = false;
                    this.toast.error('Error', err.error?.message || 'Update failed');
                }
            });
        } else {
            this.boxService.createBox(this.currentBox).subscribe({
                next: (res) => {
                    this.isSaving = false;
                    this.boxes = [res.data, ...this.boxes];
                    this.toast.success('Success', 'Box created');
                    this.closeModal();
                },
                error: (err) => {
                    this.isSaving = false;
                    this.toast.error('Error', err.error?.message || 'Creation failed');
                }
            });
        }
    }

    deleteBox(box: Box): void {
        if (box.isOccupied) {
            this.toast.error('Error', 'Cannot delete an occupied box');
            return;
        }

        this.toast.confirm(
            'Delete Box',
            `Are you sure you want to delete box #${box.number}?`,
            () => {
                this.deletingId = box._id;
                this.boxService.deleteBox(box._id).subscribe({
                    next: () => {
                        this.deletingId = null;
                        this.boxes = this.boxes.filter(b => b._id !== box._id);
                        this.toast.success('Success', `Box #${box.number} deleted`);
                    },
                    error: (err) => {
                        this.deletingId = null;
                        this.toast.error('Error', err.error?.message || 'Deletion failed');
                    }
                });
            },
            () => {},
            {
                confirmLabel: 'Delete',
                cancelLabel: 'Cancel',
                variant: 'danger',
                position: 'top-center',
                backdrop: true,
            }
        );
    }
}