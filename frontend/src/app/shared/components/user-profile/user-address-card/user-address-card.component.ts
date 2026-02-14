import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  booleanAttribute,
  ChangeDetectorRef
} from '@angular/core';
import { LeafletMapComponent } from '../../common/leaflet-map/leaflet-map.component';
import { ModalService } from '../../../services/modal.service';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { NgForOf, NgIf, CommonModule } from "@angular/common";
import {ToastService} from "../../../services/toast.service";

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
    LeafletMapComponent
  ],
  templateUrl: './user-address-card.component.html',
  styles: ``
})
export class UserAddressCardComponent implements OnInit {
  @Input() addresses: any[] = [];
  @Input({ transform: booleanAttribute }) userExist: boolean = false;
  @Output() addressAdded = new EventEmitter<any>();

  @ViewChild(LeafletMapComponent) map!: LeafletMapComponent;

  private readonly SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s\-_',.éèêëàâäùûüîïôöœçñ]+$/;

  constructor(
      public modal: ModalService,
      private userService: UserService,
      private cdr: ChangeDetectorRef,
      private toast : ToastService
  ) {}

  isAddModalOpen = false;
  isEditModalOpen = false;
  adding = false;

  // Leaflet configuration - PAS de valeur par défaut fixe
  mapCenterArr: [number, number] = [0, 0];
  mapZoom = 15;
  initialPosition?: [number, number] = undefined;
  autoSetMarker = true;

  private hasUserLocation = false;

  // Form for adding address
  addressForm: any = {
    label: '',
    latitude: null,
    longitude: null,
    description: '',
    isDefault: false
  };

  ngOnInit() {
    this.getUserLocation();
  }

  private getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("Position obtenue:", position.coords);
            this.mapCenterArr = [position.coords.latitude, position.coords.longitude];
            this.initialPosition = [...this.mapCenterArr];
            this.hasUserLocation = true;
            this.cdr.detectChanges();
          },
          (error) => {
            console.log('Geolocation error:', error);
            this.mapCenterArr = [-18.8792, 47.5079]; // Antananarivo en dernier recours
            this.initialPosition = [...this.mapCenterArr];
            this.hasUserLocation = true;
            this.cdr.detectChanges();
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
      );
    } else {
      // Géolocalisation non supportée
      this.mapCenterArr = [-18.8792, 47.5079];
      this.initialPosition = [...this.mapCenterArr];
      this.hasUserLocation = true;
    }
  }

  openAddModal() {
    if (!this.userExist) {
      this.toast.warning('Oups', 'Complete personal information first', 5000);
      return;
    }

    this.isAddModalOpen = true;
    this.resetForm();

    setTimeout(() => {
      if (this.map?.map) {
        this.map.map.invalidateSize();

        if (this.hasUserLocation && this.initialPosition) {
          this.map.setView(this.initialPosition, this.mapZoom);
        }
      }
    }, 300);

    // Set initial coordinates from user location
    if (this.initialPosition && this.initialPosition.length === 2) {
      this.addressForm.latitude = this.initialPosition[0];
      this.addressForm.longitude = this.initialPosition[1];
    } else {
      this.addressForm.latitude = this.mapCenterArr[0];
      this.addressForm.longitude = this.mapCenterArr[1];
    }
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
      latitude: this.initialPosition ? this.initialPosition[0] : this.mapCenterArr[0],
      longitude: this.initialPosition ? this.initialPosition[1] : this.mapCenterArr[1],
      description: '',
      isDefault: false
    };
  }

  // Handler for Leaflet map clicks (emitted by app-leaflet-map)
  onMapClickLeaflet(event: { lat: number; lng: number }) {
    if (!event) return;
    this.addressForm.latitude = event.lat;
    this.addressForm.longitude = event.lng;
    this.initialPosition = [event.lat, event.lng];
  }

  addAddress() {
    if (!this.addressForm.label || !this.addressForm.latitude || !this.addressForm.longitude) {
      this.toast.error('Oups','Please fill in all required fields and select a location on the map');
      return;
    }

    this.adding = true;
    this.userService.addAddress(this.addressForm).subscribe({
      next: (res) => {
        this.adding = false;
        if (res && res.success) {
          this.addresses = res.data.addresses;
          this.closeAddModal();
          this.toast.success('Success','Address added successfully.');
        } else {
          this.closeAddModal();
          const msg = res && res.message ? res.message : 'Failed to add address';
          this.toast.error('Error',msg);
        }
      },
      error: (err) => {
        console.error('Error adding address', err);
        this.adding = false;
        this.closeAddModal();
        const msg = err.error && err.error.message ? err.error.message : 'Failed to add address';
        this.toast.error('Error',msg);
      }
    });
  }

  removeAddress(indexOrId: any) {
    const addr = typeof indexOrId === 'number' ? this.addresses[indexOrId] : this.addresses.find(a => a._id === indexOrId);
    if (!addr) {
      this.toast.error('Error','Address not found');
      return;
    }

    if (addr._id) {
      this.userService.removeAddress(addr._id).subscribe({
        next: (res) => {
          console.log('Address removed', res);
          if (res && res.data && res.data.addresses) {
            this.addresses = res.data.addresses;
          } else {
            const idx = this.addresses.findIndex(a => a._id === addr._id);
            if (idx > -1) this.addresses.splice(idx, 1);
          }
        },
        error: (err) => {
          this.closeEditModal()
          console.error('Error removing address', err);
          const msg = err.error && err.error.message ? err.error.message : 'Failed to remove address';
          this.toast.error('Error',msg);
        }
      });
    } else {
      const idx = this.addresses.indexOf(addr);
      if (idx > -1) this.addresses.splice(idx, 1);
    }
  }

  isValidAddressLabel(label: string): boolean {
    if (!label) return false;
    const trimmed = label.trim();
    return trimmed.length >= 2 && this.SAFE_TEXT_REGEX.test(trimmed);
  }

// Description: free text but clean
  isValidAddressDescription(desc: string): boolean {
    if (!desc) return false;
    const trimmed = desc.trim();
    if (trimmed.length < 3) return false;
    // prevent spam like "aaaaaa"
    return !/(.)\1{4,}/.test(trimmed);
  }

  isValidLatitude(lat: number): boolean {
    return lat !== null && lat !== undefined && lat >= -90 && lat <= 90;
  }

  isValidLongitude(lng: number): boolean {
    return lng !== null && lng !== undefined && lng >= -180 && lng <= 180;
  }

  isMapSelected(): boolean {
    return this.isValidLatitude(this.addressForm.latitude)
        && this.isValidLongitude(this.addressForm.longitude);
  }


  isAddressFormInvalid(): boolean {
    if (!this.addressForm) return true;

    if (!this.isValidAddressLabel(this.addressForm.label)) return true;
    if (!this.isValidAddressDescription(this.addressForm.description)) return true;
    if (!this.isValidLatitude(this.addressForm.latitude)) return true;
    if (!this.isValidLongitude(this.addressForm.longitude)) return true;
    if (!this.isMapSelected()) return true;


    return false;
  }
}