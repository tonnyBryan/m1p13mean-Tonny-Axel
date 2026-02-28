const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OpeningHoursSchema = new Schema({
  day: { type: Number, required: true }, // 1 = lundi ... 7 = dimanche
  openTime: { type: String, required: true }, // "08:00"
  closeTime: { type: String, required: true }, // "20:00"
  isClosed: { type: Boolean, default: false }
}, { _id: false });

const CoordinatesSchema = new Schema({
  latitude: { type: Number },
  longitude: { type: Number }
}, { _id: false });

const LocationSchema = new Schema({
  address: { type: String },
  city: { type: String },
  postalCode: { type: String },
  country: { type: String },
  coordinates: CoordinatesSchema
}, { _id: false });

const MediaSchema = new Schema({
  url: { type: String }
}, { _id: false });

const ContactSchema = new Schema({
  phone: { type: String },
  email: { type: String },
  website: { type: String }
}, { _id: false });

const CentreCommercialSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  logo: MediaSchema,
  coverImage: MediaSchema,
  contact: ContactSchema,
  location: LocationSchema,
  planAPrice: { type: Number, default: 0 },
  planBPrice: { type: Number, default: 0 },
  openingHours: [OpeningHoursSchema],
  services: [String]
}, { timestamps: true });

module.exports = mongoose.model('CentreCommercial', CentreCommercialSchema);
