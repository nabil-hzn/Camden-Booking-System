import React, { useState, useEffect } from 'react';
import { Booking, BookingFormDetails, Room } from '../types';
import LucideIcon from './LucideIcon';
import { addMinutesToTime, getTodayDateString } from '../utils/bookingTime';

const TERMS_DOCUMENT_URL = 'https://drive.google.com/file/d/1xlL8pmJ6lG25zGfhaMIIPoBuBV1DR44X/view';

interface MyBookingsProps {
  bookings: Booking[];
  rooms: Room[];
  selectedRoomId: string;
  selectedDate: string;
  selectedSlotTimes: string[];
  setSelectedSlotTimes: (slots: string[]) => void;
  onConfirmBooking: (details: BookingFormDetails) => void;
  onCancelBooking: (bookingId: string) => void;
  currentUserEmail: string;
}

export default function MyBookings({
  bookings,
  rooms,
  selectedRoomId,
  selectedDate,
  selectedSlotTimes,
  setSelectedSlotTimes,
  onConfirmBooking,
  onCancelBooking,
  currentUserEmail,
}: MyBookingsProps) {
  // Tabs: 'form' (Submit Booking) or 'list' (My Bookings)
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [clinicName, setClinicName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [description, setDescription] = useState('');
  const [hasCatering, setHasCatering] = useState<boolean | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  const activeRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];
  const isNap = activeRoom.type === 'nap';
  const isLounge = activeRoom.type === 'lounge';
  const requiresTermsAgreement = activeRoom.terms.length > 0;
  const hasSelection = selectedSlotTimes.length > 0;

  // Auto-switch tab & reset form fields whenever a fresh selection begins or the room changes
  useEffect(() => {
    if (hasSelection) {
      setActiveTab('form');
      setError('');
      setClinicName('');
      setUnitNumber('');
      setContactNo('');
      setDescription('');
      setHasCatering(null);
      setAgreedToTerms(false);
    }
  }, [hasSelection, selectedRoomId]);

  const meetsMinimum = selectedSlotTimes.length >= activeRoom.minBookingHours;
  const canSubmit = meetsMinimum
    && (!isLounge || hasCatering !== null)
    && (!requiresTermsAgreement || agreedToTerms);
  const rangeStart = selectedSlotTimes[0];
  const rangeEnd = selectedSlotTimes.length > 0
    ? addMinutesToTime(selectedSlotTimes[selectedSlotTimes.length - 1], 60)
    : undefined;

  // Filter bookings belonging to current user, from today onward, sorted chronologically
  const todayStr = getTodayDateString();
  const myBookings = bookings
    .filter(b => b.userEmail === currentUserEmail && b.date >= todayStr)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.slot.localeCompare(b.slot);
    });

  // Helper to format time label (e.g. "14:00" to "02:00 PM")
  const formatTimeLabel = (timeStr: string) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    const formattedHours = String(adjustedHours).padStart(2, '0');
    return `${formattedHours}:${String(mins).padStart(2, '0')} ${ampm}`;
  };

  // Helper to format date display format (e.g. "Wednesday, July 15")
  const formatDateLabel = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoomMeta = (roomId: string) => {
    return rooms.find(r => r.id === roomId);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!clinicName.trim()) {
      setError('Please enter the clinic name.');
      return;
    }

    if (isNap && !unitNumber.trim()) {
      setError('Please enter the unit number.');
      return;
    }

    if (!isNap && !contactNo.trim()) {
      setError('Please enter a contact number.');
      return;
    }

    if (!isNap && !description.trim()) {
      setError('Please enter a description of the event.');
      return;
    }

    if (isLounge && hasCatering === null) {
      setError('Please indicate whether catering service is required.');
      return;
    }

    if (requiresTermsAgreement && !agreedToTerms) {
      setError('Please agree to the Terms & Conditions to proceed.');
      return;
    }

    if (selectedSlotTimes.length === 0) {
      setError('No time slot selected.');
      return;
    }

    if (!meetsMinimum) {
      setError(`${activeRoom.name} requires a minimum of ${activeRoom.minBookingHours} hour(s) per booking. Select ${activeRoom.minBookingHours - selectedSlotTimes.length} more hour(s).`);
      return;
    }

    // Call submit handler in parent
    onConfirmBooking({
      clinicName: clinicName.trim(),
      unitNumber: isNap ? unitNumber.trim() : undefined,
      contactNo: !isNap ? contactNo.trim() : undefined,
      hasCatering: isLounge ? hasCatering ?? undefined : undefined,
      description: !isNap ? description.trim() : undefined,
    });

    // Automatically switch to bookings list to view the newly created reservation
    setActiveTab('list');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-md shadow-slate-100/40 h-full flex flex-col overflow-hidden" id="my-bookings-panel">
      
      {/* Dynamic Tab Switcher */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 shrink-0" id="bookings-panel-tabs">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none
            ${activeTab === 'form' 
              ? 'bg-white border border-slate-200/80 text-[#0f172b] shadow-xs' 
              : 'text-slate-500 hover:text-[#0f172b] hover:bg-white/45'
            }
          `}
          id="tab-submit-booking"
        >
          <LucideIcon name="CalendarPlus" size={14} className={activeTab === 'form' ? 'text-[#0f172b]' : 'text-slate-400'} />
          <span>Book a Slot</span>
          {selectedSlotTimes.length > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none
            ${activeTab === 'list' 
              ? 'bg-white border border-slate-200/80 text-[#0f172b] shadow-xs' 
              : 'text-slate-500 hover:text-[#0f172b] hover:bg-white/45'
            }
          `}
          id="tab-active-bookings"
        >
          <LucideIcon name="BookMarked" size={14} className={activeTab === 'list' ? 'text-[#0f172b]' : 'text-slate-400'} />
          <span>My Bookings</span>
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            activeTab === 'list' ? 'bg-[#0f172b]/10 text-[#0f172b]' : 'bg-slate-200/80 text-slate-500'
          }`}>
            {myBookings.length}
          </span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 flex flex-col p-3">
        
        {activeTab === 'form' ? (
          /* ========================================================
             SUBMISSION FORM TAB
             ======================================================== */
          selectedSlotTimes.length > 0 ? (
            <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col justify-between min-h-0">

              {/* Form Inputs (Scrollable if viewport is tiny) */}
              <div className="space-y-4 overflow-y-auto pr-0.5 flex-1 min-h-0 pb-3 scrollbar-thin">

                {/* Header detail */}
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <h4 className="text-sm font-bold text-[#0f172b] leading-tight flex items-center gap-1">
                    <LucideIcon name="Shield" size={12} className="text-[#0f172b]/70" />
                    <span>{activeRoom.name}</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 mt-2.5 pt-2.5 border-t border-slate-200/50">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-sans">
                      <LucideIcon name="Calendar" className="text-[#0f172b]/70 shrink-0" size={13} />
                      <span className="font-semibold">{formatDateLabel(selectedDate)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-mono">
                      <LucideIcon name="Clock" className="text-[#0f172b]/70 shrink-0" size={13} />
                      <span className="font-bold">
                        {formatTimeLabel(rangeStart)} - {rangeEnd && formatTimeLabel(rangeEnd)}
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-sans font-semibold ${meetsMinimum ? 'text-[#0f172b]/70' : 'text-amber-600'}`}>
                    <LucideIcon name={meetsMinimum ? 'CheckCircle' : 'AlertCircle'} size={11} />
                    <span>
                      {selectedSlotTimes.length} hour{selectedSlotTimes.length > 1 ? 's' : ''} selected
                      {!meetsMinimum && ` — minimum ${activeRoom.minBookingHours} hour(s) required`}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200/50 text-rose-700 text-xs rounded-lg flex items-center space-x-1.5">
                    <LucideIcon name="AlertCircle" size={13} className="shrink-0 text-rose-600" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Clinic Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block font-sans">
                    Clinic Name <span className="text-[#0f172b]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <LucideIcon name="Building2" size={14} />
                    </span>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Enter clinic name"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0f172b] focus:ring-1 focus:ring-[#0f172b]/10 transition-all font-sans"
                      required
                    />
                  </div>
                </div>

                {isNap ? (
                  /* Unit # (Napping Room only) */
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block font-sans">
                      Unit # <span className="text-[#0f172b]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <LucideIcon name="Hash" size={14} />
                      </span>
                      <input
                        type="text"
                        value={unitNumber}
                        onChange={(e) => setUnitNumber(e.target.value)}
                        placeholder="E.g. #04-12"
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0f172b] focus:ring-1 focus:ring-[#0f172b]/10 transition-all font-sans"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Contact No */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block font-sans">
                        Contact No <span className="text-[#0f172b]">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <LucideIcon name="Phone" size={14} />
                        </span>
                        <input
                          type="tel"
                          value={contactNo}
                          onChange={(e) => setContactNo(e.target.value)}
                          placeholder="E.g. 9123 4567"
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0f172b] focus:ring-1 focus:ring-[#0f172b]/10 transition-all font-sans"
                          required
                        />
                      </div>
                    </div>

                    {/* Description of Event */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block font-sans">
                        Description of Event <span className="text-[#0f172b]">*</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="E.g. Client presentation for external stakeholders..."
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0f172b] focus:ring-1 focus:ring-[#0f172b]/10 transition-all font-sans resize-none"
                        required
                      />
                    </div>
                  </>
                )}

                {/* With Catering Service (Entire Lounge only) */}
                {isLounge && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block font-sans">
                      With Catering Service <span className="text-slate-400 font-normal normal-case">(Not provided by Camden Medical)</span> <span className="text-[#0f172b]">*</span>
                    </label>
                    <div className="flex gap-1.5">
                      {([true, false] as const).map((option) => (
                        <button
                          key={String(option)}
                          type="button"
                          onClick={() => setHasCatering(option)}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer focus:outline-none
                            ${hasCatering === option
                              ? 'bg-[#0f172b] border-[#0f172b] text-white shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
                            }
                          `}
                        >
                          {option ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Booking Terms & Conditions - pinned above the confirm action, not scrolled away */}
              {requiresTermsAgreement && (
                <div className="space-y-2.5 pt-3 border-t border-slate-100 shrink-0">
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-1.5 space-y-1">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide block">Booking Terms</span>
                    <ul className="space-y-1 text-[10px] text-slate-600 font-sans list-disc list-inside">
                      {activeRoom.terms.map((term) => (
                        <li key={term}>{term}</li>
                      ))}
                    </ul>
                    <a
                      href={TERMS_DOCUMENT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] font-semibold text-[#0f172b] underline hover:text-[#0a1023] cursor-pointer inline-block"
                    >
                      Click to view the full terms & conditions
                    </a>
                  </div>

                  <label className="flex items-start gap-2 text-[10px] text-slate-600 font-sans cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-[#0f172b] focus:ring-1 focus:ring-[#0f172b]/20 cursor-pointer"
                    />
                    <span>I declare that the details given are correct and I agree to the Terms &amp; Conditions.</span>
                  </label>
                </div>
              )}

              {/* Form Action Buttons at Bottom */}
              <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedSlotTimes([])}
                  className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 border border-slate-200 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Cancel Selection
                </button>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#0f172b] hover:bg-[#0a1023] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer focus:outline-none"
                >
                  <LucideIcon name="CheckCircle" size={13} />
                  <span>Book Slot Now</span>
                </button>
              </div>

            </form>
          ) : (
            /* Empty state when no slot selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="h-11 w-11 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 animate-pulse">
                <LucideIcon name="CalendarClock" size={20} />
              </div>
              <h4 className="text-xs font-bold text-[#0f172b] uppercase tracking-wide">No Slot Selected</h4>
              <p className="text-[11px] text-slate-400 mt-2 max-w-[210px] leading-relaxed">
                Click any available <span className="font-semibold text-slate-600">Schedule</span> button on the time slots grid to book instantly.
              </p>
            </div>
          )
        ) : (
          /* ========================================================
             ACTIVE BOOKINGS LIST TAB
             ======================================================== */
          myBookings.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4">
              <div className="h-11 w-11 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-200">
                <LucideIcon name="Calendar" size={20} />
              </div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">No Bookings Yet</h4>
              <p className="text-[11px] text-slate-400 mt-2 max-w-[210px] leading-relaxed">
                You do not have any reservations scheduled yet. Browse available spaces, choose a date and slot, and secure your time!
              </p>
            </div>
          ) : (
            /* Scrollable bookings list */
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 min-h-0 scrollbar-thin">
              {myBookings.map((booking) => {
                const room = getRoomMeta(booking.roomId);
                if (!room) return null;

                return (
                  <div
                    key={booking.id}
                    className="group relative overflow-hidden bg-slate-50/60 border border-slate-200 rounded-xl p-3 transition-all duration-200 hover:border-[#0f172b]/30 hover:bg-slate-50/90 flex flex-col justify-between"
                    id={`my-booking-card-${booking.id}`}
                  >
                    {/* Visual left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0f172b]" />

                    <div className="pl-1">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#0f172b] tracking-tight truncate">
                            {room.name}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-sans mt-0.5 flex items-center gap-1">
                            <LucideIcon name="MapPin" size={10} className="text-slate-400 shrink-0" />
                            <span className="truncate">{room.floor.split(',')[0]}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => onCancelBooking(booking.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer focus:outline-none"
                          title="Cancel reservation"
                          id={`cancel-my-booking-btn-${booking.id}`}
                        >
                          <LucideIcon name="Trash2" size={13} />
                        </button>
                      </div>

                      {/* Scheduled Date/Time info */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/50 bg-slate-100/30 p-1.5 rounded-lg border border-slate-150">
                        <div className="flex items-center space-x-1">
                          <LucideIcon name="Calendar" className="text-[#0f172b]/60 shrink-0" size={11} />
                          <span className="text-[10px] font-semibold text-slate-500 font-sans">
                            {formatDateLabel(booking.date)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <LucideIcon name="Clock" className="text-[#0f172b]/60 shrink-0" size={11} />
                          <span className="text-[10px] font-semibold text-slate-500 font-mono">
                            {formatTimeLabel(booking.slot)} - {formatTimeLabel(addMinutesToTime(booking.slot, booking.durationMinutes))}
                          </span>
                        </div>
                      </div>

                      {/* Clinic / contact details */}
                      <div className="mt-2 text-[10px] space-y-1">
                        <div className="flex items-center gap-1 text-slate-600">
                          <LucideIcon name="Building2" size={11} className="text-[#0f172b]/60 shrink-0" />
                          <span className="font-semibold truncate">{booking.clinicName}</span>
                        </div>
                        {booking.unitNumber && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <LucideIcon name="Hash" size={11} className="text-[#0f172b]/60 shrink-0" />
                            <span>Unit {booking.unitNumber}</span>
                          </div>
                        )}
                        {booking.contactNo && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <LucideIcon name="Phone" size={11} className="text-[#0f172b]/60 shrink-0" />
                            <span>{booking.contactNo}</span>
                          </div>
                        )}
                        {room.type === 'lounge' && typeof booking.hasCatering === 'boolean' && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <LucideIcon name="Coffee" size={11} className="text-[#0f172b]/60 shrink-0" />
                            <span>Catering: {booking.hasCatering ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                        {booking.description && (
                          <p className="text-[9px] text-slate-400 mt-1 font-sans italic bg-slate-100/30 p-1.5 rounded border border-slate-200/40">
                            "{booking.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>
    </div>
  );
}
