export type RoomType = 'nap' | 'lounge' | 'meeting' | 'living_meeting';

export interface Amenity {
  name: string;
  iconName: string; // matches lucide icon name
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  description: string;
  capacity: number;
  floor: string;
  minBookingHours: number;
  terms: string[];
  amenities: Amenity[];
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  rating: number;
  featuredImage: string;
}

export interface Booking {
  id: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  slot: string; // HH:MM (24h)
  durationMinutes: number;
  userEmail: string;
  clinicName: string;
  unitNumber?: string;   // Napping Room bookings
  contactNo?: string;    // Non-Napping Room bookings
  description?: string;  // Non-Napping Room bookings
  hasCatering?: boolean; // Entire Lounge bookings only
  createdAt: string;
  isSimulated?: boolean;
}

export interface BookingFormDetails {
  clinicName: string;
  unitNumber?: string;
  contactNo?: string;
  description?: string;
  hasCatering?: boolean;
}

export interface TimeSlot {
  time: string; // HH:MM
  label: string; // HH:MM AM/PM
  isBooked: boolean;
  bookingId?: string;
  isCurrentUser?: boolean;
  isPastDisabled: boolean;
}
