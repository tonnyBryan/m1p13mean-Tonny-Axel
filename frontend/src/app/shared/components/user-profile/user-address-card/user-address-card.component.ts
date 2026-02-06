import { Component, Input, Output, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { ModalService } from '../../../services/modal.service';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { NgForOf, NgIf, CommonModule } from "@angular/common";

@Component({
  selector: 'app-user-address-card',
  standalone: true,
  imports: [
    CommonModule,
    InputFieldComponent,
    ButtonComponent,
    LabelComponent,
    ModalComponent,
    FormsModule,
    NgIf,
    NgForOf,
    GoogleMap,
    MapMarker
  ],
  templateUrl: './user-address-card.component.html',
  styles: ``
})
export class UserAddressCardComponent implements OnInit {
  @Input() addresses: any[] = [];
  @Output() addressAdded = new EventEmitter<any>();

  @ViewChild(GoogleMap) map!: GoogleMap;

  constructor(public modal: ModalService, private userService: UserService) {}

  isAddModalOpen = false;
  isEditModalOpen = false;
  adding = false;

  // Google Maps configuration
  mapCenter: google.maps.LatLngLiteral = { lat: -18.8792, lng: 47.5079 }; // Antananarivo par défaut
  mapZoom = 13;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
    maxZoom: 20,
    minZoom: 8,
  };

  markerPosition: google.maps.LatLngLiteral = { ...this.mapCenter };
  markerOptions: google.maps.MarkerOptions = {
    draggable: true,
  };

  // Form for adding address
  addressForm: any = {
    label: '',
    latitude: null,
    longitude: null,
    description: '',
    isDefault: false
  };

  ngOnInit() {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
            this.mapCenter = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.markerPosition = { ...this.mapCenter };
          },
          (error) => {
            console.log('Geolocation error:', error);
          }
      );
    }
  }

  openAddModal() {
    this.isAddModalOpen = true;
    this.resetForm();
    // Set initial coordinates from marker
    this.addressForm.latitude = this.markerPosition.lat;
    this.addressForm.longitude = this.markerPosition.lng;
  }

  closeAddModal() {
    this.isAddModalOpen = false;
    this.resetForm();
  }

  openEditModal() {
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  resetForm() {
    this.addressForm = {
      label: '',
      latitude: this.markerPosition.lat,
      longitude: this.markerPosition.lng,
      description: '',
      isDefault: false
    };
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.markerPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      this.addressForm.latitude = this.markerPosition.lat;
      this.addressForm.longitude = this.markerPosition.lng;
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.markerPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      this.addressForm.latitude = this.markerPosition.lat;
      this.addressForm.longitude = this.markerPosition.lng;
    }
  }

  addAddress() {
    if (!this.addressForm.label || !this.addressForm.latitude || !this.addressForm.longitude) {
      alert('Please fill in all required fields and select a location on the map');
      return;
    }

    this.adding = true;
    this.userService.addAddress(this.addressForm).subscribe({
      next: (res) => {
        console.log('Address added', res);
        this.adding = false;
        this.closeAddModal();
        this.addressAdded.emit(res.data || null);
      },
      error: (err) => {
        console.error('Error adding address', err);
        this.adding = false;
      }
    });
  }

  removeAddress(index: number) {
    if (confirm('Are you sure you want to remove this address?')) {
      this.addresses.splice(index, 1);
      // Optional: Call API to remove from backend
      // this.userService.removeAddress(addressId).subscribe(...)
    }
  }
}