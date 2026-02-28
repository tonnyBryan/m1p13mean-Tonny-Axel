import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BoutiqueService } from '../../../shared/services/boutique.service';
import { Boutique } from '../../../core/models/boutique.model';
import {PageBreadcrumbComponent} from "../../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {ToastService} from "../../../shared/services/toast.service";
import {RatingStarComponent} from "../../../shared/components/common/rating-star/rating-star.component";

@Component({
  selector: 'app-boutique-liste-user',
  standalone: true,
  imports: [CommonModule, RouterModule, PageBreadcrumbComponent, RatingStarComponent],
  templateUrl: './boutique-liste-user.component.html',
  styleUrls: ['./boutique-liste-user.component.css']
})
export class BoutiqueListeUserComponent implements OnInit {
  pageTitle = 'Stores';

  boutiques: Boutique[] = [];
  isLoading = false;
  skeletonArray = Array(3).fill(0);

  viewIcon = ' <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n' +
      '                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>\n' +
      '                        </svg>';

  constructor(private boutiqueService: BoutiqueService, private toast : ToastService) {}

  ngOnInit(): void {
    this.loadBoutiques();
  }

  loadBoutiques(): void {
    this.isLoading = true;
    const params: any = {
      limit: 999,
      sort: '-createdAt',
      isActive: true,
      isValidated: true
    };

    this.boutiqueService.getBoutiques(params).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.success) {
          if (res.data && res.data.items) {
            this.boutiques = res.data.items;
            console.log(this.boutiques);
          }
        } else {
          alert(res.msg);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors du chargement des boutiques :', err);
        if (err.error && err.error.message) {
          this.toast.error('Error',err.error.message, 0);
        } else {
          this.toast.error('Error','An error occurred while fetching stores',0);
        }
      }
    });
  }

  truncate(text: string | undefined, length = 100): string {
    if (!text) return '';
    return text.length > length ? text.slice(0, length).trim() + '...' : text;
  }
}