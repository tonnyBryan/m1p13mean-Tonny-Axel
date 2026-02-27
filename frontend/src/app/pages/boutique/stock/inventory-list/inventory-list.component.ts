import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../../../shared/services/inventory.service';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { InputFieldComponent } from '../../../../shared/components/form/input/input-field.component';
import { DatePickerComponent } from '../../../../shared/components/form/date-picker/date-picker.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        PageBreadcrumbComponent,
        InputFieldComponent,
        DatePickerComponent,
        FormsModule
    ],
    templateUrl: './inventory-list.component.html'
})
export class InventoryListComponent implements OnInit {
    inventories: any[] = [];
    pagination = {
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        limit: 10
    };

    filters = {
        startDate: '',
        endDate: '',
        note: ''
    };

    isLoading = false;
    isSkeletonLoading = true;

    constructor(private inventoryService: InventoryService) { }

    ngOnInit(): void {
        this.loadInventories();
    }

    loadInventories(): void {
        this.isLoading = true;
        this.isSkeletonLoading = true;

        const params: any = {
            page: this.pagination.page,
            limit: this.pagination.limit,
            sort: '-createdAt'
        };

        if (this.filters.startDate) params['createdAt[gte]'] = this.filters.startDate;
        if (this.filters.endDate) params['createdAt[lte]'] = this.filters.endDate;
        if (this.filters.note) {
            params['note[regex]'] = this.filters.note;
            params['note[options]'] = 'i';
        }

        this.inventoryService.getInventoryList(params).subscribe({
            next: (res) => {
                this.inventories = res.data.items;
                console.log(this.inventories);
                this.pagination = res.data.pagination;
                this.isLoading = false;
                this.isSkeletonLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                this.isSkeletonLoading = false;
            }
        });
    }

    onFilterChange(): void {
        this.pagination.page = 1;
        this.loadInventories();
    }

    onDateChange(key: string, event: any): void {
        if (event && event.dateStr) {
            (this.filters as any)[key] = event.dateStr;
            this.onFilterChange();
        } else if (!event) {
            (this.filters as any)[key] = '';
            this.onFilterChange();
        }
    }

    resetFilters(): void {
        this.filters = {
            startDate: '',
            endDate: '',
            note: ''
        };
        this.onFilterChange();
    }

    changePage(page: number): void {
        if (page < 1 || page > this.pagination.totalPages) return;
        this.pagination.page = page;
        this.loadInventories();
    }
}
