import { Booking } from '../types';

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  const total = timeToMinutes(time) + minutesToAdd;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Finds a booking (from an already room/date-filtered list) that covers the given slot start time
export const findBookingCoveringSlot = (
  roomDateBookings: Booking[],
  slotTime: string
): Booking | undefined => {
  const slotMinutes = timeToMinutes(slotTime);
  return roomDateBookings.find(b => {
    const start = timeToMinutes(b.slot);
    const end = start + b.durationMinutes;
    return slotMinutes >= start && slotMinutes < end;
  });
};
