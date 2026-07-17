import React from 'react';
import {
  VolumeX,
  BedDouble,
  Lightbulb,
  Sparkles,
  EyeOff,
  Wind,
  Coffee,
  Wifi,
  Compass,
  Sofa,
  Zap,
  BookOpen,
  Tv,
  PenTool,
  Video,
  Mic,
  Thermometer,
  Cpu,
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Trash2,
  Lock,
  Search,
  Info,
  Shield,
  BookMarked,
  Briefcase,
  Moon,
  Sun,
  LogOut,
  AlertCircle,
  Activity,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  VolumeX,
  BedDouble,
  Lightbulb,
  Sparkles,
  EyeOff,
  Wind,
  Coffee,
  Wifi,
  Compass,
  Sofa,
  Zap,
  BookOpen,
  Tv,
  PenTool,
  Video,
  Mic,
  Thermometer,
  Cpu,
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Trash2,
  Lock,
  Search,
  Info,
  Shield,
  BookMarked,
  Briefcase,
  Moon,
  Sun,
  LogOut,
  AlertCircle,
  Activity,
};

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size }: LucideIconProps) {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    // Fallback icon
    return <Sparkles className={className} size={size} />;
  }
  return <IconComponent className={className} size={size} />;
}
