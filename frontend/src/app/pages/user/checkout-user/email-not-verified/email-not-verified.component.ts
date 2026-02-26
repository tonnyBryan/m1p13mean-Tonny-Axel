import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-email-not-verified',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './email-not-verified.component.html',
  styleUrl: './email-not-verified.component.css'
})
export class EmailNotVerifiedComponent {
  constructor(public router: Router) {}
}