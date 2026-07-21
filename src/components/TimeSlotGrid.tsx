import { Booking, TimeSlot } from '../types';
import LucideIcon from './LucideIcon';
import { findBookingCoveringSlot } from '../utils/bookingTime';

interface TimeSlotGridProps {
  selectedRoomId: string;
  roomType: string;
  minBookingHours: number;
  selectedDate: string;
  bookings: Booking[];
  currentUserEmail: string;
  onSelectionChange: (slotTimes: string[]) => void;
  onCancelBooking: (bookingId: string) => void;
  selectedSlotTimes: string[];
}

export const TIME_SLOTS_PRESET = [
  { time: '09:00', label: '09:00 AM' },
  { time: '10:00', label: '10:00 AM' },
  { time: '11:00', label: '11:00 AM' },
  { time: '12:00', label: '12:00 PM' },
  { time: '13:00', label: '01:00 PM' },
  { time: '14:00', label: '02:00 PM' },
  { time: '15:00', size: '10:00 AM', label: '03:00 PM' },
  { time: '16:00', label: '04:00 PM' },
  { time: '17:00', label: '05:00 PM' },
  { time: '18:00', label: '06:00 PM' },
  { time: '19:00', label: '07:00 PM' },
  { time: '20:00', label: '08:00 PM' },
];

export default function TimeSlotGrid({
  selectedRoomId,
  roomType,
  minBookingHours,
  selectedDate,
  bookings,
  currentUserEmail,
  onSelectionChange,
  onCancelBooking,
  selectedSlotTimes,
}: TimeSlotGridProps) {

  const now = new Date();

  // Helper to check if slot is in the past for today
  const isSlotInPast = (slotTime: string) => {
    const todayStr = now.toISOString().split('T')[0];
    if (selectedDate < todayStr) return true;
    if (selectedDate > todayStr) return false;

    // It is today, check the hours and minutes
    const [slotHour, slotMin] = slotTime.split(':').map(Number);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMin <= currentMin) return true;

    return false;
  };

  const dayRoomBookings = bookings.filter(
    b => b.roomId === selectedRoomId && b.date === selectedDate
  );

  // No facility is bookable on Sundays
  const [selectedYear, selectedMonth, selectedDay] = selectedDate.split('-').map(Number);
  const isSunday = new Date(selectedYear, selectedMonth - 1, selectedDay).getDay() === 0;

  // Build slot metadata; a multi-hour booking covers every preset hour it spans
  const slots: TimeSlot[] = TIME_SLOTS_PRESET.map(preset => {
    const matchedBooking = findBookingCoveringSlot(dayRoomBookings, preset.time);
    const isBooked = !!matchedBooking;
    const isCurrentUser = isBooked && matchedBooking?.userEmail === currentUserEmail;

    return {
      time: preset.time,
      label: preset.label,
      isBooked,
      bookingId: matchedBooking?.id,
      isCurrentUser,
      isPastDisabled: (isSlotInPast(preset.time) || isSunday) && !isBooked,
    };
  });

  // Napping Room is limited to 1 hour (1 slot) per account per day
  const napDailyLimitReached =
    roomType === 'nap' &&
    bookings.some(
      b => b.roomId === selectedRoomId && b.date === selectedDate && b.userEmail === currentUserEmail
    );

  const isSlotBlocked = (slot: TimeSlot) =>
    !slot.isBooked && !slot.isPastDisabled && napDailyLimitReached;

  // Only non-napping rooms may select more than one contiguous hour
  const allowMultiple = roomType !== 'nap';

  const handleSlotClick = (clickedIndex: number) => {
    const clickedSlot = slots[clickedIndex];
    if (clickedSlot.isBooked || clickedSlot.isPastDisabled || isSlotBlocked(clickedSlot)) return;

    if (!allowMultiple) {
      onSelectionChange(selectedSlotTimes[0] === clickedSlot.time ? [] : [clickedSlot.time]);
      return;
    }

    if (selectedSlotTimes.length === 0) {
      onSelectionChange([clickedSlot.time]);
      return;
    }

    const selectedIndices = selectedSlotTimes
      .map(t => slots.findIndex(s => s.time === t))
      .sort((a, b) => a - b);
    const firstIdx = selectedIndices[0];
    const lastIdx = selectedIndices[selectedIndices.length - 1];

    if (selectedSlotTimes.includes(clickedSlot.time)) {
      // Shrink the range from whichever edge was clicked
      if (selectedSlotTimes.length === 1) {
        onSelectionChange([]);
      } else if (clickedIndex === firstIdx) {
        onSelectionChange(slots.slice(firstIdx + 1, lastIdx + 1).map(s => s.time));
      } else if (clickedIndex === lastIdx) {
        onSelectionChange(slots.slice(firstIdx, lastIdx).map(s => s.time));
      } else {
        // Clicking a middle slot collapses the range down to just that slot
        onSelectionChange([clickedSlot.time]);
      }
      return;
    }

    // Extend the range to the clicked slot, as long as every hour in between is available
    const rangeStart = Math.min(firstIdx, clickedIndex);
    const rangeEnd = Math.max(lastIdx, clickedIndex);
    const candidate = slots.slice(rangeStart, rangeEnd + 1);
    const obstructed = candidate.some(s => s.isBooked || s.isPastDisabled || isSlotBlocked(s));

    onSelectionChange(obstructed ? [clickedSlot.time] : candidate.map(s => s.time));
  };

  const lastSelectedTime = selectedSlotTimes[selectedSlotTimes.length - 1];
  const selectedHours = selectedSlotTimes.length;
  const meetsMinimum = selectedHours === 0 || selectedHours >= minBookingHours;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3 shadow-md shadow-slate-100/40 h-full flex flex-col" id="timeslot-scheduler">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 shrink-0">
        <p className="text-slate-500 text-xs font-sans">
          {allowMultiple ? (
            <>Select {minBookingHours > 1 ? `at least ${minBookingHours} consecutive hours` : 'one or more consecutive hours'} for <span className="font-mono text-[#0f172b] font-semibold">{selectedDate}</span>.</>
          ) : (
            <>Select an hourly interval to book your slot for <span className="font-mono text-[#0f172b] font-semibold">{selectedDate}</span>.</>
          )}
        </p>

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-sans">
          {allowMultiple && selectedHours > 0 && (
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border shadow-2xs ${meetsMinimum ? 'bg-[#0f172b]/5 border-[#0f172b]/10 text-[#0f172b]' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
              <LucideIcon name={meetsMinimum ? 'CheckCircle' : 'AlertCircle'} size={12} />
              <span className="font-semibold">
                {selectedHours} hour{selectedHours > 1 ? 's' : ''}{!meetsMinimum ? ` (min ${minBookingHours})` : ''}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-white p-0.5 rounded bg-slate-600 flex items-center justify-center">
              <LucideIcon name="Check" size={8} className="stroke-[3px]" />
            </span>
            <span className="font-semibold text-slate-700">Mine</span>
          </div>
        </div>
      </div>

      {/* Grid structure wrapped in scrollable flex-1 div */}
      <div className="flex-1 overflow-y-auto pb-1 min-h-0 w-full pr-1 scrollbar-thin">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {slots.map((slot, index) => {
            const isDailyLimitBlocked = isSlotBlocked(slot);
            const isDisabled = slot.isPastDisabled || isDailyLimitBlocked;
            const isSelected = selectedSlotTimes.includes(slot.time);
            const isLastSelected = isSelected && slot.time === lastSelectedTime;

            // Booked/Selected styling classes
            let btnStyleClass = 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/90 hover:border-[#0f172b]/30 text-slate-700 hover:scale-[1.01] shadow-xs';
            if (slot.isBooked) {
              if (slot.isCurrentUser) {
                // Mine: distinct gray marker (check icon + tint), no navy border needed
                btnStyleClass = 'bg-slate-300 border-slate-400 text-slate-900 shadow-sm';
              } else {
                // Booked by someone else: same muted treatment as a past slot, no name shown
                btnStyleClass = 'bg-slate-100/30 border-transparent text-slate-300 cursor-not-allowed opacity-30';
              }
            } else if (isSelected) {
              // Currently being selected (not yet confirmed): same navy treatment as the calendar's selected day
              btnStyleClass = 'bg-[#0f172b] border-[#0f172b] text-white shadow-md shadow-[#0f172b]/20';
            } else if (isDailyLimitBlocked) {
              btnStyleClass = 'bg-amber-50/60 border-amber-100 text-amber-500 cursor-not-allowed opacity-70';
            } else if (slot.isPastDisabled) {
              btnStyleClass = 'bg-slate-100/30 border-transparent text-slate-300 cursor-not-allowed opacity-30';
            }

            return (
              <div
                key={`slot-${slot.time}`}
                onClick={() => handleSlotClick(index)}
                className={`
                  group/slot relative flex flex-col justify-between rounded-xl p-2 transition-all duration-200 border h-[68px] w-full select-none
                  ${!slot.isBooked && !isDisabled ? 'cursor-pointer' : 'cursor-default'}
                  ${btnStyleClass}
                `}
                id={`timeslot-cell-${slot.time}`}
              >
                {/* Slot Time Label */}
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-bold tracking-tight flex items-center gap-1 ${isSelected ? 'text-white' : slot.isCurrentUser ? 'text-slate-900' : 'text-slate-800'}`}>
                    {slot.label}
                  </span>

                  {/* Micro Icon Indicators */}
                  {slot.isCurrentUser ? (
                    <span className="text-white p-0.5 rounded bg-slate-700 inline-flex items-center justify-center">
                      <LucideIcon name="Check" size={9} className="stroke-[3px]" />
                    </span>
                  ) : isSelected ? (
                    <span className="text-[#0f172b] p-0.5 rounded bg-white inline-flex items-center justify-center">
                      <LucideIcon name="Check" size={9} className="stroke-[3px]" />
                    </span>
                  ) : isDailyLimitBlocked ? (
                    <span className="text-amber-500">
                      <LucideIcon name="Lock" size={9} />
                    </span>
                  ) : null}
                </div>

                {/* Status and Action row */}
                <div className="mt-1 flex items-center justify-between gap-1">
                  {(slot.isCurrentUser || isSelected) ? (
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] font-sans truncate font-semibold leading-none ${isSelected ? 'text-slate-200' : 'text-slate-800'}`}>
                        {slot.isCurrentUser ? 'Your session' : 'Selecting...'}
                      </p>
                      {slot.isCurrentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (slot.bookingId) onCancelBooking(slot.bookingId);
                          }}
                          className="text-[9px] text-rose-600 hover:text-rose-800 font-bold underline mt-0.5 cursor-pointer transition-all block focus:outline-none leading-none"
                          id={`cancel-btn-${slot.bookingId}`}
                        >
                          Release Slot
                        </button>
                      )}
                      {isLastSelected && (
                        <span className="text-[8px] text-slate-200 font-semibold block mt-0.5 leading-none animate-pulse">
                          Complete details →
                        </span>
                      )}
                    </div>
                  ) : isDailyLimitBlocked ? (
                    <span className="text-[9px] text-amber-600 font-sans italic font-semibold leading-none">Daily limit reached</span>
                  ) : (slot.isBooked || slot.isPastDisabled) ? (
                    <span className="text-[9px] text-slate-400 font-sans italic leading-none">Unavailable</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotClick(index);
                      }}
                      className="w-full py-0.5 text-[9px] font-bold text-center rounded-md bg-slate-200/80 group-hover/slot:bg-[#0f172b] group-hover/slot:text-white transition-all duration-200 cursor-pointer text-slate-700 focus:outline-none leading-tight"
                      id={`book-action-btn-${slot.time}`}
                    >
                      Book
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
