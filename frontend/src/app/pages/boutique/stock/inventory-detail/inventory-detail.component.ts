// inventory-detail/inventory-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { InventoryService } from '../../../../shared/services/inventory.service';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageBreadcrumbComponent],
  templateUrl: './inventory-detail.component.html',
})
export class InventoryDetailComponent implements OnInit {
  inventory: any = null;
  isLoading = true;
  error = '';

  constructor(
      private route: ActivatedRoute,
      private inventoryService: InventoryService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  load(id: string): void {
    this.isLoading = true;
    this.inventoryService.getInventoryById(id).subscribe({
      next: (res) => {
        this.inventory = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Unable to load this inventory count.';
        this.isLoading = false;
      }
    });
  }

  /** Difference between counted and expected stock */
  getDiff(line: any): number {
    return line.countedQuantity - line.stockBefore;
  }

  get totalLines(): number {
    return this.inventory?.lines?.length || 0;
  }

  get adjustedLines(): number {
    return this.inventory?.lines?.filter((l: any) => l.movementCreated).length || 0;
  }

  get linesWithDiscrepancy(): number {
    return this.inventory?.lines?.filter((l: any) => this.getDiff(l) !== 0).length || 0;
  }
}