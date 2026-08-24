declare module 'lucide-react-native' {
  import { FC } from 'react';
  import { SvgProps } from 'react-native-svg';

  export interface IconProps extends SvgProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number;
  }

  export type Icon = FC<IconProps>;

  export const Plus: Icon;
  export const Minus: Icon;
  export const Layers: Icon;
  export const FileText: Icon;
  export const X: Icon;
  export const Check: Icon;
  export const PlusCircle: Icon;
  export const DollarSign: Icon;
  export const ShoppingBag: Icon;
  export const UtensilsCrossed: Icon;
  export const Trash2: Icon;
  export const Printer: Icon;
  export const Edit3: Icon;
  export const Clock: Icon;
  export const RotateCcw: Icon;
  export const Zap: Icon;
  export const Hash: Icon;
  export const Search: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const XCircle: Icon;
  export const Tag: Icon;
  export const CreditCard: Icon;
  export const Banknote: Icon;
  export const Send: Icon;
  export const Sparkles: Icon;
  export const Radio: Icon;
  export const ChefHat: Icon;
  export const Table: Icon;
  export const Smartphone: Icon;
  export const BellRing: Icon;
  export const ArrowLeft: Icon;
  export const RefreshCw: Icon;
  export const AlertCircle: Icon;
  export const CheckCircle: Icon;
  export const Info: Icon;
  export const Flame: Icon;
  export const Beef: Icon;
  export const Coffee: Icon;
  export const CircleDollarSign: Icon;
  export const Utensils: Icon;
  export const Menu: Icon;
  export const Database: Icon;
  export const Wifi: Icon;
}
