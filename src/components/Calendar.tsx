import { useState } from 'react';
import { Booking } from '../types';
import LucideIcon from './LucideIcon';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  bookings: Booking[];
}

export default function Calendar({ selectedDate, onSelectDate, bookings }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse currently selected date or fall back to today
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, etc.
    const day = new Date(year, month, 1).getDay();
    // Adjust to make Monday index 0:
    // Sun(0) -> 6, Mon(1) -> 0, Tue(2) -> 1, ..., Sat(6) -> 5
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleDaySelect = (dayNum: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
    onSelectDate(dateStr);
  };

  // Helper to check if a specific day is in the past
  const isPastDay = (dayNum: number) => {
    const checkDate = new Date(currentYear, currentMonth, dayNum);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Render days array
  const renderDays = () => {
    const days = [];
    const totalSlots = firstDayIndex + daysInMonth;
    const rowCount = Math.ceil(totalSlots / 7);

    for (let i = 0; i < rowCount * 7; i++) {
      const dayNum = i - firstDayIndex + 1;
      const isValidDay = dayNum > 0 && dayNum <= daysInMonth;

      if (!isValidDay) {
        days.push(<div key={`empty-${i}`} className="w-full aspect-square" />);
        continue;
      }

      const formattedMonth = String(currentMonth + 1).padStart(2, '0');
      const formattedDay = String(dayNum).padStart(2, '0');
      const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;

      const isSelected = selectedDate === dateString;
      const isToday =
        today.getDate() === dayNum &&
        today.getMonth() === currentMonth &&
        today.getFullYear() === currentYear;

      const isPast = isPastDay(dayNum);

      // Check if this date has bookings to display a indicator dot
      const dayBookings = bookings.filter(b => b.date === dateString);
      const hasBookings = dayBookings.length > 0;

      // Color coding for booking count
      let dotColorClass = 'bg-[#0f172b]/40';
      if (dayBookings.length >= 3) {
        dotColorClass = 'bg-[#0f172b]'; // busy / active
      } else if (dayBookings.length > 0) {
        dotColorClass = 'bg-[#0f172b]/70'; // available spots/some booked
      }

      days.push(
        <button
          key={`day-${dayNum}`}
          disabled={isPast}
          onClick={() => handleDaySelect(dayNum)}
          className={`
            relative w-full aspect-square max-w-8 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-sans transition-all duration-200 focus:outline-none cursor-pointer
            ${isPast ? 'text-slate-300 cursor-not-allowed opacity-40' : 'text-slate-700 font-medium'}
            ${isToday && !isSelected ? 'border border-[#0f172b]/50 text-[#0f172b] font-semibold bg-[#0f172b]/5' : ''}
            ${isSelected ? 'bg-[#0f172b] text-white font-bold shadow-md shadow-[#0f172b]/20 scale-105' : 'hover:bg-slate-100'}
          `}
          title={isToday ? 'Today' : undefined}
          id={`calendar-day-${dateString}`}
        >
          <span className="font-display text-[13px]">{dayNum}</span>
          {hasBookings && !isPast && (
            <span 
              className={`absolute bottom-0.5 h-0.5 w-0.5 rounded-full ${isSelected ? 'bg-white' : dotColorClass}`} 
            />
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-md shadow-slate-100/40 h-full flex flex-col" id="calendar-widget">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2.5 shrink-0 relative px-1">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0f172b] transition-all cursor-pointer z-10"
          title="Previous Month"
          id="btn-prev-month"
        >
          <LucideIcon name="ChevronLeft" size={16} />
        </button>

        <h3 className="absolute inset-x-0 mx-auto text-center font-serif italic font-extrabold text-base sm:text-lg text-[#0f172b] tracking-wide pointer-events-none">
          {monthNames[currentMonth]} {currentYear}
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#0f172b] transition-all cursor-pointer z-10"
          title="Next Month"
          id="btn-next-month"
        >
          <LucideIcon name="ChevronRight" size={16} />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1 shrink-0">
        {daysOfWeek.map(day => (
          <div key={day} className="text-slate-400 text-[10px] font-bold font-sans uppercase tracking-wider py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 justify-items-center flex-1 items-center min-h-0">
        {renderDays()}
      </div>
    </div>
  );
}
