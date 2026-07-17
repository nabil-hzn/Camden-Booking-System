import { API_BASE_URL } from '../config';
import { Booking, BookingFormDetails } from '../types';

export class AuthError extends Error {}

async function request<T>(path: string, idToken: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    throw new AuthError('Session expired. Please sign in again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export function fetchBookings(idToken: string): Promise<Booking[]> {
  return request<{ bookings: Booking[] }>('/bookings', idToken).then((data) => data.bookings);
}

export function createBooking(
  idToken: string,
  roomId: string,
  date: string,
  slot: string,
  durationMinutes: number,
  details: BookingFormDetails
): Promise<Booking> {
  return request<Booking>('/bookings', idToken, {
    method: 'POST',
    body: JSON.stringify({ roomId, date, slot, durationMinutes, ...details }),
  });
}

export function cancelBooking(idToken: string, bookingId: string): Promise<void> {
  return request<void>(`/bookings/${bookingId}`, idToken, { method: 'DELETE' });
}
