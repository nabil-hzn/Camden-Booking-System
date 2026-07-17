import { Room, Booking } from '../types';
import LucideIcon from './LucideIcon';

interface RoomCardProps {
  key?: string;
  room: Room;
  isSelected: boolean;
  onSelect: () => void;
  selectedDate: string;
  bookings: Booking[];
}

export default function RoomCard({ room, isSelected, onSelect, selectedDate, bookings }: RoomCardProps) {
  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'nap': return 'Napping Room';
      case 'meeting': return 'Meeting Room';
      case 'living_meeting': return 'Living Room & Meeting Room';
      case 'lounge': return 'Entire Lounge';
      default: return type;
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col px-2.5 py-1.5 sm:px-3 sm:py-2 md:py-2.5 cursor-pointer group focus:outline-none justify-between gap-1 sm:gap-1.5 md:gap-2 flex-1 shrink-0 min-h-[96px] sm:min-h-[104px] lg:min-h-[112px]
        ${isSelected 
          ? 'bg-white border-[#0f172b]' : 'bg-white/80 border-slate-200 hover:border-[#0f172b]/25 hover:bg-white shadow-xs'
        }
      `}
      id={`room-card-${room.id}`}
    >
      {/* Background Subtle Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${room.gradientFrom}/5 ${room.gradientTo}/5 opacity-20 pointer-events-none`} />

      {/* Main Info */}
      <div className="relative z-10 w-full min-h-0 flex-shrink-0 pr-4">
        <h3 className="font-serif italic font-extrabold text-[11px] sm:text-xs md:text-sm lg:text-base text-[#0f172b] leading-tight group-hover:text-[#0a1023] transition-colors line-clamp-2">
          {room.name}
        </h3>
      </div>

      {/* Pricing/Rules Details (Complimentary or Hourly Rates) */}
      <div className="relative z-10 w-full text-[8px] sm:text-[9px] md:text-[10px] text-slate-500 font-sans leading-normal min-h-0 flex-1 flex flex-col justify-center">
        {room.type === 'nap' ? (
          <div className="bg-slate-50 border border-slate-100 p-1 sm:p-1.5 rounded-lg w-full">
            <div className="flex items-center mb-0.5 sm:mb-1">
              <span className="bg-emerald-50 text-emerald-700 px-1 sm:px-1.5 py-0.5 rounded font-mono text-[7px] sm:text-[8px] md:text-[9px] uppercase tracking-wider font-semibold">Complimentary</span>
            </div>
            <p className="text-[7px] sm:text-[8px] md:text-[9px] text-slate-400 font-medium italic leading-tight">
              Only for doctors and directors of clinics, up to 1 hour per booking/day.
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-100 p-1 sm:p-1.5 rounded-lg space-y-0.5 sm:space-y-1 w-full">
            <div className="flex justify-between items-center gap-1 text-[7px] sm:text-[8px] md:text-[9px]">
              <span className="text-slate-400 font-medium truncate min-w-0">Operating hours</span>
              <span className="font-bold text-[#0f172b] font-mono flex-shrink-0">
                {room.type === 'meeting' ? '$80' : room.type === 'living_meeting' ? '$200' : '$580'}/hr
              </span>
            </div>
            <div className="flex justify-between items-center gap-1 text-[7px] sm:text-[8px] md:text-[9px] border-t border-slate-200/50 pt-0.5 sm:pt-1">
              <span className="text-slate-400 font-medium truncate min-w-0">After operating hours</span>
              <span className="font-bold text-[#0f172b] font-mono flex-shrink-0">
                {room.type === 'meeting' ? '$120' : room.type === 'living_meeting' ? '$300' : '$870'}/hr
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Specs Row */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 text-slate-500 relative z-10 flex-shrink-0">
        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-sans flex items-center gap-1 bg-slate-50 px-1 sm:px-1.5 py-0.5 rounded-md border border-slate-100">
          <LucideIcon name="Clock" size={8} className="text-[#0f172b]/70 sm:size-[10px]" />
          <span className="text-slate-500 font-medium">{room.floor}</span>
        </span>
        <span className="text-[7px] sm:text-[8px] md:text-[9px] font-sans flex items-center gap-1 bg-slate-50 px-1 sm:px-1.5 py-0.5 rounded-md border border-slate-100">
          <LucideIcon name="Users" size={8} className="text-[#0f172b]/70 sm:size-[10px]" />
          <span className="text-slate-500 font-medium">Cap: {room.capacity}</span>
        </span>
      </div>

      {/* Selected glowing checkmark indicator */}
      {isSelected && (
        <div className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-[#0f172b] animate-pulse" />
      )}
    </button>
  );
}
