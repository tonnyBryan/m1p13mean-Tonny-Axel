import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { BoxService } from '../../../shared/services/box.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Box } from '../../../core/models/box.model';

import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';
import { ModalComponent } from '../../../shared/components/ui/modal/modal.component';
import { InputFieldComponent } from '../../../shared/components/form/input/input-field.component';
import { LabelComponent } from '../../../shared/components/form/label/label.component';

@Component({
    selector: 'app-box-list',
    standalone: true,
    imports: [
        CommonModule,
        PageBreadcrumbComponent,
        FormsModule,
        BadgeComponent,
        ButtonComponent,
        ModalComponent,
        InputFieldComponent,
        LabelComponent
    ],
    templateUrl: './box-list.component.html',
    styleUrls: ['./box-list.component.css']
})
export class BoxListComponent implements OnInit {
    pageTitle = 'Box Management';
    boxes: Box[] = [];
    statusFilter = 'all'; // all, vide, occupe
    isLoading = false;

    showModal = false;
    isEditing = false;
    currentBox: Partial<Box> = {};

    constructor(
        private boxService: BoxService,
        private toast: ToastService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadBoxes();
    }

    loadBoxes(): void {
        this.isLoading = true;
        this.boxService.getBoxes(this.statusFilter).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success) {
                    this.boxes = res.data;
                }
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Error loading boxes', err);
                this.toast.error('Erreur', 'Impossible de charger les Box');
            }
        });
    }

    onFilterChange(status: string) {
        this.statusFilter = status;
        this.loadBoxes();
    }

    openModal(box?: Box): void {
        this.isEditing = !!box;
        if (box) {
            this.currentBox = { ...box };
        } else {
            this.currentBox = {
                number: '',
                type: '',
                pricePerMonth: 0
            };
        }
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.currentBox = {};
    }

    onSubmit(form: NgForm): void {
        if (form.invalid) return;

        if (this.isEditing && this.currentBox._id) {
            this.boxService.updateBox(this.currentBox._id, this.currentBox).subscribe({
                next: (res) => {
                    this.toast.success('Succès', 'Box mis à jour');
                    this.closeModal();
                    this.loadBoxes();
                },
                error: (err) => {
                    this.toast.error('Erreur', err.error?.message || 'Erreur lors de la mise à jour');
                }
            });
        } else {
            this.boxService.createBox(this.currentBox).subscribe({
                next: (res) => {
                    this.toast.success('Succès', 'Box créé');
                    this.closeModal();
                    this.loadBoxes();
                },
                error: (err) => {
                    this.toast.error('Erreur', err.error?.message || 'Erreur lors de la création');
                }
            });
        }
    }

    async deleteBox(box: Box): Promise<void> {
        if (box.isOccupied) {
            this.toast.error('Erreur', 'Impossible de supprimer un Box occupé');
            return;
        }

        const confirmed = await this.toast.confirmAsync(
            'Supprimer',
            `Voulez-vous supprimer le Box ${box.number} ?`,
            { variant: 'danger' }
        );

        if (confirmed) {
            this.boxService.deleteBox(box._id).subscribe({
                next: () => {
                    this.toast.success('Succès', 'Box supprimé');
                    this.loadBoxes();
                },
                error: (err) => {
                    this.toast.error('Erreur', err.error?.message || 'Erreur lors de la suppression');
                }
            });
        }
    }
}
