import { Booking, Room } from '../types';
import LucideIcon from './LucideIcon';

interface StatsDashboardProps {
  bookings: Booking[];
  rooms: Room[];
  selectedDate: string;
}

export default function StatsDashboard({ bookings, rooms, selectedDate }: StatsDashboardProps) {
  // Bookings specifically for the selected date
  const todayBookings = bookings.filter(b => b.date === selectedDate);
  const totalTodayCount = todayBookings.length;

  // Bookings by Room Type
  const countByType = (type: string) => {
    const roomIds = rooms.filter(r => r.type === type).map(r => r.id);
    return todayBookings.filter(b => roomIds.includes(b.roomId)).length;
  };

  const napBookings = countByType('nap');
  const loungeBookings = countByType('lounge');
  const meetingBookings = countByType('meeting');

  // Total available slots preset count (13 slots per room, 3 rooms = 39 slots total)
  const totalPresetSlots = 13 * rooms.length;
  const utilizationPercent = Math.round((totalTodayCount / totalPresetSlots) * 100) || 0;

  // Find the busiest room today
  const getBusiestRoom = () => {
    if (totalTodayCount === 0) return 'None';
    
    let busiest = 'None';
    let maxCount = -1;

    rooms.forEach(room => {
      const count = todayBookings.filter(b => b.roomId === room.id).length;
      if (count > maxCount && count > 0) {
        maxCount = count;
        busiest = room.name;
      }
    });

    return busiest;
  };

  const busiestRoom = getBusiestRoom();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-dashboard">
      {/* Stat 1: Total Reservations Today */}
      <div className="bg-[#0F0F11] border border-[#1F1F21] rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/20">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 font-sans block">
            Locked Today
          </span>
          <h4 className="text-2xl font-display font-bold text-white mt-1">
            {totalTodayCount} <span className="text-slate-500 text-xs font-sans font-normal">sessions</span>
          </h4>
          <p className="text-[10px] text-slate-500 font-sans mt-1">
            Selected Date: <span className="font-mono text-[#C5A059]">{selectedDate}</span>
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
          <LucideIcon name="BookMarked" size={20} />
        </div>
      </div>

      {/* Stat 2: Utilization index */}
      <div className="bg-[#0F0F11] border border-[#1F1F21] rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/20">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 font-sans block">
            Occupancy Index
          </span>
          <h4 className="text-2xl font-display font-bold text-white mt-1">
            {utilizationPercent}%
          </h4>
          
          {/* Miniature progress bar */}
          <div className="w-24 bg-[#131316] border border-[#1F1F21] h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-[#C5A059] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
          <LucideIcon name="Activity" size={20} />
        </div>
      </div>

      {/* Stat 3: Busiest Venue */}
      <div className="bg-[#0F0F11] border border-[#1F1F21] rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/20">
        <div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 font-sans block">
            Trending Space
          </span>
          <h4 className="text-sm font-bold text-[#E5E5E7] mt-1.5 truncate max-w-[140px]" title={busiestRoom}>
            {busiestRoom}
          </h4>
          <p className="text-[10px] text-slate-500 font-sans mt-1">
            Highest booking demand today
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
          <LucideIcon name="Sparkles" size={20} />
        </div>
      </div>

      {/* Stat 4: Room-specific breaks */}
      <div className="bg-[#0F0F11] border border-[#1F1F21] rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="w-full">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 font-sans block mb-2">
            Distribution
          </span>
          
          <div className="flex items-center justify-between text-[10px] font-sans text-slate-400 space-x-1">
            <div className="flex flex-col items-center flex-1 bg-[#131316] p-1.5 rounded border border-[#1F1F21]">
              <span className="font-mono font-semibold text-[#C5A059]">{napBookings}</span>
              <span>Naps</span>
            </div>
            <div className="flex flex-col items-center flex-1 bg-[#131316] p-1.5 rounded border border-[#1F1F21]">
              <span className="font-mono font-semibold text-[#C5A059]">{loungeBookings}</span>
              <span>Lounges</span>
            </div>
            <div className="flex flex-col items-center flex-1 bg-[#131316] p-1.5 rounded border border-[#1F1F21]">
              <span className="font-mono font-semibold text-[#C5A059]">{meetingBookings}</span>
              <span>Meetings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
