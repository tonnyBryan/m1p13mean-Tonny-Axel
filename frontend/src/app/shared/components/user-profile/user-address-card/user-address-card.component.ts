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

  constructor(
      public modal: ModalService,
      private userService: UserService,
      private cdr: ChangeDetectorRef
  ) {}

  isAddModalOpen = false;
  isEditModalOpen = false;
  adding = false;

  // Leaflet configuration - PAS de valeur par défaut fixe
  mapCenterArr: [number, number] = [0, 0]; // ✅ Sera mis à jour par la géolocalisation
  mapZoom = 15; // ✅ Zoom plus proche pour une meilleure vue
  initialPosition?: [number, number] = undefined; // ✅ undefined au départ
  autoSetMarker = true;

  // ✅ Suivre si on a obtenu la position
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
    // ✅ Obtenir la position de l'utilisateur au chargement du composant
    this.getUserLocation();
  }

  // ✅ Nouvelle méthode pour obtenir la géolocalisation
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
            // ✅ Fallback si géolocalisation refusée
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
      alert("Complete personal information first");
      return;
    }

    this.isAddModalOpen = true;
    this.resetForm();

    // ✅ Attendre que le modal soit affiché, puis invalider la taille de la carte
    setTimeout(() => {
      if (this.map?.map) {
        this.map.map.invalidateSize();

        // ✅ Recentrer sur la position actuelle si disponible
        if (this.hasUserLocation && this.initialPosition) {
          this.map.setView(this.initialPosition, this.mapZoom);
        }
      }
    }, 300); // ✅ 300ms pour être sûr que le modal est bien affiché

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
      alert('Please fill in all required fields and select a location on the map');
      return;
    }

    this.adding = true;
    this.userService.addAddress(this.addressForm).subscribe({
      next: (res) => {
        console.log('Address added', res);

        console.log(res);
        this.adding = false;
        if (res && res.success) {
          this.addresses = res.data.addresses;
          this.closeAddModal();
          // this.addressAdded.emit(newAddr);
        } else {
          const msg = res && res.message ? res.message : 'Failed to add address';
          alert(msg);
        }
      },
      error: (err) => {
        console.error('Error adding address', err);
        this.adding = false;
        alert('Failed to add address');
      }
    });
  }

  removeAddress(indexOrId: any) {
    console.log("ioid = " + indexOrId);
    const addr = typeof indexOrId === 'number' ? this.addresses[indexOrId] : this.addresses.find(a => a._id === indexOrId);
    if (!addr) {
      alert('Address not found');
      return;
    }

    if (!confirm('Are you sure you want to remove this address?')) return;

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
          console.error('Error removing address', err);
          alert('Failed to remove address');
        }
      });
    } else {
      const idx = this.addresses.indexOf(addr);
      if (idx > -1) this.addresses.splice(idx, 1);
    }
  }
}