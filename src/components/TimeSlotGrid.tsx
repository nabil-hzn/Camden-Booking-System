import { Booking, TimeSlot } from '../types';
import LucideIcon from './LucideIcon';

interface TimeSlotGridProps {
  selectedRoomId: string;
  selectedDate: string;
  bookings: Booking[];
  currentUserEmail: string;
  onSelectSlot: (slotTime: string) => void;
  onCancelBooking: (bookingId: string) => void;
  selectedSlotTime?: string | null;
}

export const TIME_SLOTS_PRESET = [
  { time: '08:00', label: '08:00 AM' },
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
  selectedDate,
  bookings,
  currentUserEmail,
  onSelectSlot,
  onCancelBooking,
  selectedSlotTime,
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

  // Build the time slot items based on current room and selected date bookings
  const getTimeSlots = (): TimeSlot[] => {
    const dayRoomBookings = bookings.filter(
      b => b.roomId === selectedRoomId && b.date === selectedDate
    );

    return TIME_SLOTS_PRESET.map(preset => {
      // Find if this preset hour matches a booking slot
      const matchedBooking = dayRoomBookings.find(b => b.slot === preset.time);
      const isBooked = !!matchedBooking;
      const isCurrentUser = isBooked && matchedBooking?.userEmail === currentUserEmail;

      return {
        time: preset.time,
        label: preset.label,
        isBooked,
        bookedBy: matchedBooking?.userName,
        bookingId: matchedBooking?.id,
        isCurrentUser,
      };
    });
  };

  const slots = getTimeSlots();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md shadow-slate-100/40 h-full flex flex-col" id="timeslot-scheduler">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 shrink-0">
        <div>
          <h3 className="font-serif italic font-semibold text-lg text-[#0f172b] flex items-center gap-2">
            <LucideIcon name="Clock" className="text-[#0f172b]" size={18} />
            <span>Time Slots</span>
          </h3>
          <p className="text-slate-500 text-xs font-sans mt-0.5">
            Select an hourly interval to book your slot for <span className="font-mono text-[#0f172b] font-semibold">{selectedDate}</span>.
          </p>
        </div>
        
        {/* Status indicators - Only Mine as requested */}
        <div className="flex items-center space-x-3 text-xs text-slate-500 font-sans">
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shadow-2xs">
            <span className="text-white p-0.5 rounded bg-[#0f172b] flex items-center justify-center">
              <LucideIcon name="Check" size={8} className="stroke-[3px]" />
            </span>
            <span className="font-semibold text-slate-700">Mine</span>
          </div>
        </div>
      </div>

      {/* Grid structure wrapped in scrollable flex-1 div */}
      <div className="flex-1 overflow-y-auto pb-1 min-h-0 w-full pr-1 scrollbar-thin">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {slots.map(slot => {
            const isPast = isSlotInPast(slot.time);
            const isDisabled = isPast && !slot.isBooked;
            const isSelected = selectedSlotTime === slot.time;

            // Booked/Selected styling classes
            let btnStyleClass = 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/90 hover:border-[#0f172b]/30 text-slate-700 hover:scale-[1.01] shadow-xs';
            if (slot.isBooked) {
              if (slot.isCurrentUser) {
                // "using check is enough for mine" - clean white background with navy border, shadow and text, no grey background
                btnStyleClass = 'bg-white border-[#0f172b] text-[#0f172b] shadow-sm ring-1 ring-[#0f172b]/10';
              } else {
                btnStyleClass = 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed';
              }
            } else if (isSelected) {
              // Current active selection
              btnStyleClass = 'bg-white border-[#0f172b] text-[#0f172b] shadow-sm ring-2 ring-[#0f172b]/20';
            } else if (isDisabled) {
              btnStyleClass = 'bg-slate-100/30 border-transparent text-slate-300 cursor-not-allowed opacity-30';
            }

            return (
              <div
                key={`slot-${slot.time}`}
                onClick={() => {
                  if (!slot.isBooked && !isDisabled) {
                    onSelectSlot(slot.time);
                  }
                }}
                className={`
                  group/slot relative flex flex-col justify-between rounded-xl p-2 transition-all duration-200 border h-[68px] w-full select-none
                  ${!slot.isBooked && !isDisabled ? 'cursor-pointer' : 'cursor-default'}
                  ${btnStyleClass}
                `}
                id={`timeslot-cell-${slot.time}`}
              >
                {/* Slot Time Label */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-tight text-slate-800 flex items-center gap-1">
                    {slot.label}
                  </span>
                  
                  {/* Micro Icon Indicators */}
                  {(slot.isBooked || isSelected) ? (
                    (slot.isCurrentUser || isSelected) ? (
                      <span className="text-white p-0.5 rounded bg-[#0f172b] inline-flex items-center justify-center">
                        <LucideIcon name="Check" size={9} className="stroke-[3px]" />
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        <LucideIcon name="Lock" size={9} />
                      </span>
                    )
                  ) : isDisabled ? (
                    <span className="text-slate-400 text-[8px] font-mono uppercase tracking-wider">Past</span>
                  ) : null}
                </div>

                {/* Status and Action row */}
                <div className="mt-1 flex items-center justify-between gap-1">
                  {(slot.isBooked || isSelected) ? (
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] text-slate-600 font-sans truncate font-semibold leading-none">
                        {slot.isCurrentUser ? 'Your session' : isSelected ? 'Selecting...' : `${slot.bookedBy}`}
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
                      {isSelected && (
                        <span className="text-[8px] text-[#0f172b] font-semibold block mt-0.5 leading-none animate-pulse">
                          Complete details →
                        </span>
                      )}
                    </div>
                  ) : isDisabled ? (
                    <span className="text-[9px] text-slate-400 font-sans italic leading-none">Unavailable</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSlot(slot.time);
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
