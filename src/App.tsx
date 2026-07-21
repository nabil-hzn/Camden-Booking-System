import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ROOMS } from './data/rooms';
import { Booking, BookingFormDetails } from './types';
import { findBookingCoveringSlot } from './utils/bookingTime';
import { decodeGoogleIdToken, GoogleUser } from './utils/auth';
import { fetchBookings, createBooking, cancelBooking, AuthError } from './utils/api';

// Component imports
import Calendar from './components/Calendar';
import RoomCard from './components/RoomCard';
import TimeSlotGrid from './components/TimeSlotGrid';
import MyBookings from './components/MyBookings';
import LucideIcon from './components/LucideIcon';
import Login from './components/Login';

const ID_TOKEN_STORAGE_KEY = 'cmscheduler_id_token';

export default function App() {
  // ----------------------------------------------------
  // Auth State
  // ----------------------------------------------------
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Bookings state, loaded from the API once signed in
  const [bookings, setBookings] = useState<Booking[]>([]);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Selected date and room
  const [selectedDate, setSelectedDate] = useState(() => getTodayString());
  const [selectedRoomId, setSelectedRoomId] = useState('nap-1');

  // Slot selection state for booking modal (contiguous hours, ordered ascending)
  const [selectedSlotTimes, setSelectedSlotTimes] = useState<string[]>([]);

  // UI Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  // Helper to trigger floating toast notification
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Restore a session from a previously stored ID token on first load
  useEffect(() => {
    const storedToken = sessionStorage.getItem(ID_TOKEN_STORAGE_KEY);
    if (storedToken) {
      const decoded = decodeGoogleIdToken(storedToken);
      if (decoded) {
        setUser(decoded);
        setIdToken(storedToken);
        loadBookings(storedToken);
      } else {
        sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
      }
    }
    setAuthLoading(false);
  }, []);

  const handleSignOut = () => {
    sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
    setIdToken(null);
    setUser(null);
    setBookings([]);
    window.google?.accounts.id.disableAutoSelect();
  };

  const loadBookings = async (token: string, opts: { silent?: boolean } = {}) => {
    try {
      const data = await fetchBookings(token);
      setBookings(data);
    } catch (err) {
      if (err instanceof AuthError) {
        handleSignOut();
        showToast('Session expired. Please sign in again.', 'error');
      } else if (!opts.silent) {
        showToast('Failed to load bookings. Please refresh.', 'error');
      }
    }
  };

  // Keep the time-slot grid in sync with bookings made by other users:
  // poll periodically, and refetch immediately whenever the tab regains focus.
  useEffect(() => {
    if (!idToken) return;

    const interval = setInterval(() => {
      loadBookings(idToken, { silent: true });
    }, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadBookings(idToken, { silent: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [idToken]);

  const handleCredential = (token: string) => {
    const decoded = decodeGoogleIdToken(token);
    if (!decoded) {
      showToast('Failed to sign in. Please try again.', 'error');
      return;
    }
    sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, token);
    setIdToken(token);
    setUser(decoded);
    loadBookings(token);
  };

  // Get active selected room metadata
  const activeRoom = ROOMS.find(r => r.id === selectedRoomId) || ROOMS[0];

  // ----------------------------------------------------
  // Actions
  // ----------------------------------------------------

  // Handle new booking confirmation
  const handleConfirmBooking = async (details: BookingFormDetails) => {
    if (!idToken || !user) return;
    if (selectedSlotTimes.length === 0) return;

    // Napping Room: enforce 1 hour (1 slot) per account per day
    if (activeRoom.type === 'nap') {
      const alreadyBookedNapToday = bookings.some(
        b => b.roomId === selectedRoomId && b.date === selectedDate && b.userEmail === user.email
      );
      if (alreadyBookedNapToday) {
        showToast('Napping Room is limited to 1 hour per account per day.', 'error');
        setSelectedSlotTimes([]);
        return;
      }
    }

    // Every other room has a minimum number of consecutive hours per booking
    if (selectedSlotTimes.length < activeRoom.minBookingHours) {
      showToast(`${activeRoom.name} requires a minimum of ${activeRoom.minBookingHours} hour(s) per booking.`, 'error');
      return;
    }

    // Double check availability across the full selected range
    const roomDateBookings = bookings.filter(
      b => b.roomId === selectedRoomId && b.date === selectedDate
    );
    const conflict = selectedSlotTimes.some(time => findBookingCoveringSlot(roomDateBookings, time));

    if (conflict) {
      showToast('One of the selected hours was locked by another user. Please select again.', 'error');
      setSelectedSlotTimes([]);
      return;
    }

    try {
      const newBooking = await createBooking(
        idToken,
        selectedRoomId,
        selectedDate,
        selectedSlotTimes[0],
        selectedSlotTimes.length * 60,
        details
      );
      setBookings(prev => [...prev, newBooking]);
      setSelectedSlotTimes([]);
      showToast(`Successfully locked slot for ${activeRoom.name}!`, 'success');
    } catch (err) {
      if (err instanceof AuthError) {
        handleSignOut();
        showToast('Session expired. Please sign in again.', 'error');
        return;
      }
      showToast(err instanceof Error ? err.message : 'Failed to create booking.', 'error');
      // Reconcile local state in case someone else booked the slot first
      loadBookings(idToken);
    }
  };

  // Handle cancellation of a booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!idToken) return;
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    if (!bookingToCancel) return;

    const bookingRoom = ROOMS.find(r => r.id === bookingToCancel.roomId);
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel your reservation for ${bookingRoom?.name || 'this room'} on ${bookingToCancel.date} at ${bookingToCancel.slot}?`
    );

    if (!confirmCancel) return;

    try {
      await cancelBooking(idToken, bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      showToast('Reservation successfully canceled and released.', 'info');
    } catch (err) {
      if (err instanceof AuthError) {
        handleSignOut();
        showToast('Session expired. Please sign in again.', 'error');
        return;
      }
      showToast(err instanceof Error ? err.message : 'Failed to cancel booking.', 'error');
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-[#f8fafc]" />;
  }

  if (!user || !idToken) {
    return <Login onCredential={handleCredential} />;
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#0f172b]/20 selection:text-[#0f172b]" id="main-app-container">
      {/* ----------------------------------------------------
          NAV BAR / APP HEADER
          ---------------------------------------------------- */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs" id="app-nav-bar">
        <div className="max-w-none mx-auto px-3 sm:px-4 lg:px-4 h-16 flex items-center justify-between">

          {/* Logo Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#0f172b] to-[#0a1023] flex items-center justify-center text-white shadow-md shadow-[#0f172b]/10">
              <LucideIcon name="Calendar" size={18} className="text-white stroke-[2.5px]" />
            </div>
            <div>
              <h1 className="font-serif italic text-2xl tracking-wide leading-none">
                <span className="font-extrabold text-black">CM</span><span className="font-bold text-slate-400">Scheduler</span>
              </h1>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/85 px-3 py-1.5 rounded-2xl animate-fade-in" id="user-profile-header">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full shadow-sm object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#0f172b] flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm">
                {user.name.substring(0, 2)}
              </div>
            )}

            <div className="text-left hidden sm:block">
              <span className="text-xs font-semibold text-slate-800 block truncate max-w-[140px]">
                {user.name}
              </span>
              <span className="text-[9px] text-slate-400 block font-mono truncate max-w-[140px]">
                {user.email}
              </span>
            </div>

            <div className="text-left sm:hidden text-xs">
              <span className="font-semibold text-slate-700 block">{user.name}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-rose-600 cursor-pointer focus:outline-none"
              title="Sign out"
              id="sign-out-btn"
            >
              <LucideIcon name="LogOut" size={14} />
            </button>
          </div>

        </div>
      </header>

      {/* ----------------------------------------------------
          MAIN CONTENT WRAPPER
          ---------------------------------------------------- */}
      <main className="flex-1 max-w-none w-full mx-auto px-3 sm:px-4 lg:px-4 py-4 flex flex-col lg:min-h-0 lg:overflow-hidden">

        {/* 3-Column Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch lg:flex-1 lg:min-h-0" id="app-scheduling-workspace">

          {/* COLUMN 1: Facility Option (Left, spacious, full height) */}
          <div className="lg:col-span-3 space-y-3 flex flex-col h-full min-h-0">
            {/* Notes Section */}
            <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl text-center text-[9px] sm:text-[10px] font-sans leading-relaxed shadow-sm shrink-0 flex flex-col justify-center items-center gap-1.5 sm:gap-2" id="operating-notes-card">
              <div>
                <span className="font-bold text-[#0f172b] block text-[10px] sm:text-[11px] uppercase tracking-wide">During Operating Hours</span>
                <span className="text-slate-600 font-medium">Weekdays: 9am to 6pm / Saturdays: 9am to 2pm</span>
              </div>
              <div>
                <span className="font-bold text-[#0f172b] block text-[10px] sm:text-[11px] uppercase tracking-wide">After Operating Hours</span>
                <span className="text-slate-600 font-medium">Weekdays: 6pm to 9pm / Saturdays: 2pm to 6pm</span>
              </div>
              <p className="text-rose-600 font-semibold text-[9.5px] sm:text-[10.5px]">
                Not available for booking on Sundays and Public Holidays
              </p>
              <p className="text-slate-400 text-[8px] sm:text-[9px] italic">
                All rates subject to applicable GST.
              </p>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-md shadow-slate-100/40 flex flex-col flex-1 min-h-0" id="facility-option-card">
                <div className="flex items-center justify-between mb-2 sm:mb-3 shrink-0 px-1">
                  <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider font-sans">
                    1. Facility Option
                  </h2>
                </div>

                {/* Rooms List - stretched to fill full vertical height */}
                <div className="space-y-1.5 sm:space-y-2 lg:space-y-2.5 flex flex-col flex-1 overflow-y-auto pb-1 scrollbar-thin" id="rooms-grid-container">
                  {ROOMS.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      isSelected={selectedRoomId === room.id}
                      onSelect={() => {
                        setSelectedRoomId(room.id);
                        setSelectedSlotTimes([]);
                        showToast(`Switched view to: ${room.name}`, 'info');
                      }}
                      selectedDate={selectedDate}
                      bookings={bookings}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Combined Calendar & Time Slot (Center, wide) */}
          <div className="lg:col-span-6 flex flex-col h-full min-h-0 space-y-4">

            {/* Calendar section (Top) */}
            <div className="flex-1 flex flex-col min-h-0">
              <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider px-1 mb-2 font-sans shrink-0">
                2. Calendar
              </h2>
              <div className="flex-1 min-h-0">
                <Calendar
                  selectedDate={selectedDate}
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                    setSelectedSlotTimes([]);
                    showToast(`Viewing schedule for ${date}`, 'info');
                  }}
                  bookings={bookings}
                  currentUserEmail={user.email}
                />
              </div>
            </div>

            {/* Time Slot section (Bottom, horizontal) */}
            <div className="flex-1 flex flex-col min-h-0">
              <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider px-1 mb-2 font-sans shrink-0">
                3. Time Slot
              </h2>
              <div className="flex-1 min-h-0">
                <TimeSlotGrid
                  selectedRoomId={selectedRoomId}
                  roomType={activeRoom.type}
                  minBookingHours={activeRoom.minBookingHours}
                  selectedDate={selectedDate}
                  bookings={bookings}
                  currentUserEmail={user.email}
                  onSelectionChange={setSelectedSlotTimes}
                  onCancelBooking={handleCancelBooking}
                  selectedSlotTimes={selectedSlotTimes}
                />
              </div>
            </div>

          </div>

          {/* COLUMN 3: Submit Booking & Active Bookings (Right) */}
          <div className="lg:col-span-3 flex flex-col h-full min-h-0 space-y-3">
            <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider px-1 font-sans shrink-0">
              4. Book & Manage
            </h2>
            <div className="flex-1 min-h-0">
              <MyBookings
                bookings={bookings}
                rooms={ROOMS}
                selectedRoomId={selectedRoomId}
                selectedDate={selectedDate}
                selectedSlotTimes={selectedSlotTimes}
                setSelectedSlotTimes={setSelectedSlotTimes}
                onConfirmBooking={handleConfirmBooking}
                onCancelBooking={handleCancelBooking}
                currentUserEmail={user.email}
              />
            </div>
          </div>

        </div>

      </main>

      {/* ----------------------------------------------------
          FLOATING ACTION FEEDBACK TOASTS
          ---------------------------------------------------- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex items-center p-4 rounded-xl border shadow-xl backdrop-blur-md max-w-sm font-sans text-white bg-[#0f172b] border-[#0a1023]/20"
            id="global-feedback-toast"
          >
            <div className="mr-3">
              <LucideIcon
                name={
                  toastType === 'success'
                    ? 'Check'
                    : toastType === 'error'
                      ? 'AlertCircle'
                      : 'Info'
                }
                className={
                  toastType === 'success'
                    ? 'text-emerald-400 animate-pulse'
                    : toastType === 'error'
                      ? 'text-rose-400'
                      : 'text-blue-400'
                }
                size={18}
              />
            </div>
            <p className="text-xs font-medium text-white">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
