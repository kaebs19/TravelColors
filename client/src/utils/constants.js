// Trip Categories
export const TRIP_CATEGORIES = {
  domestic: 'محلي',
  international: 'دولي',
  hajj: 'حج',
  umrah: 'عمرة',
  honeymoon: 'شهر عسل',
  family: 'عائلي',
  adventure: 'مغامرات',
  business: 'أعمال'
};

// Booking Status
export const BOOKING_STATUS = {
  pending: { label: 'قيد الانتظار', color: 'yellow' },
  confirmed: { label: 'مؤكد', color: 'green' },
  cancelled: { label: 'ملغي', color: 'red' },
  completed: { label: 'مكتمل', color: 'blue' },
  refunded: { label: 'مسترد', color: 'gray' }
};

// Payment Status
export const PAYMENT_STATUS = {
  pending: { label: 'قيد الانتظار', color: 'yellow' },
  partial: { label: 'دفع جزئي', color: 'orange' },
  paid: { label: 'مدفوع', color: 'green' },
  refunded: { label: 'مسترد', color: 'gray' }
};

// Payment Methods
export const PAYMENT_METHODS = {
  cash: 'نقداً',
  card: 'بطاقة',
  bank_transfer: 'تحويل بنكي',
  online: 'دفع إلكتروني'
};

// User Roles
export const USER_ROLES = {
  user: 'عميل',
  employee: 'موظف',
  admin: 'مدير'
};

// Currencies
export const CURRENCIES = {
  SAR: 'ريال سعودي',
  USD: 'دولار أمريكي',
  EUR: 'يورو',
  AED: 'درهم إماراتي'
};
