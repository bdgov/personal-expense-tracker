import React from 'react';
import {
  Utensils,
  Bus,
  ShoppingCart,
  Receipt,
  HeartPulse,
  GraduationCap,
  Home,
  ShoppingBag,
  Film,
  Plane,
  MoreHorizontal,
  Briefcase,
  Store,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  DollarSign,
  Coffee,
  Fuel,
  Sparkles,
  Smartphone,
  CreditCard,
  Building,
} from 'lucide-react';

interface CategoryIconProps {
  iconName: string;
  className?: string;
  color?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils,
  Bus,
  ShoppingCart,
  Receipt,
  HeartPulse,
  GraduationCap,
  Home,
  ShoppingBag,
  Film,
  Plane,
  MoreHorizontal,
  Briefcase,
  Store,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  DollarSign,
  Coffee,
  Fuel,
  Sparkles,
  Smartphone,
  CreditCard,
  Building,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = 'w-5 h-5', color }) => {
  const IconComponent = ICON_MAP[iconName] || MoreHorizontal;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
