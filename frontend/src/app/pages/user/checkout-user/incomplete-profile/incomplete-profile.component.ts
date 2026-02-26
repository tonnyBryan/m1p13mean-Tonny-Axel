import { Component } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-incomplete-profile',
  imports: [],
  templateUrl: './incomplete-profile.component.html',
  styleUrl: './incomplete-profile.component.css',
})
export class IncompleteProfileComponent {
  constructor(protected router : Router) {
  }
}
