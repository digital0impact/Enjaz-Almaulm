// Types for the Teacher Performance App

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'admin' | 'supervisor';
  school?: string;
  department?: string;
  avatar?: string;
}

// Student related types
export interface Student {
  id: string;
  name: string;
  grade: string;
  status: 'تفوق' | 'يحتاج إلى تطوير' | 'صعوبات التعلم' | 'ضعف' | 'ممتاز' | 'مقبول';
  lastUpdate: string;
  notes: string;
  goals?: Goal[];
  needs?: string[];
  performanceEvidence?: PerformanceEvidence[];
  remedialPlans?: RemedialPlan[];
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: 'قيد التنفيذ' | 'مكتمل' | 'معلق';
  targetDate?: string;
}

export interface PerformanceEvidence {
  id: string;
  title: string;
  type: 'صورة' | 'فيديو' | 'ملف' | 'ملاحظة';
  fileName?: string;
  date: string;
  notes?: string;
  achieved: boolean;
}

export interface RemedialPlan {
  id: string;
  title: string;
  description: string;
  targetArea: string;
  startDate: string;
  endDate: string;
  status: 'نشط' | 'مكتمل' | 'معلق';
  progress: number;
}

// Performance related types
export interface PerformanceAxis {
  id: string;
  name: string;
  score: number;
  evidences: PerformanceEvidence[];
}

export interface PerformanceData {
  id: string;
  date: string;
  axes: PerformanceAxis[];
  totalScore: number;
  notes?: string;
}

// Alert related types
export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'مهم' | 'عاجل' | 'تنبيه' | 'معلومات';
  priority: 'عالية' | 'متوسطة' | 'منخفضة';
  date: string;
  isRead: boolean;
  category: string;
}

export type AlertType = 'مهم' | 'عاجل' | 'تنبيه' | 'معلومات';
export type AlertPriority = 'عالية' | 'متوسطة' | 'منخفضة';

// Calendar related types
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'اجتماع' | 'فعالية' | 'موعد' | 'عطلة';
  description?: string;
  isHoliday?: boolean;
}

// Absence related types
export interface Absence {
  id: string;
  studentName: string;
  date: string;
  type: 'غياب' | 'تأخير' | 'انصراف مبكر';
  reason?: string;
  notes?: string;
}

// Settings related types
export interface UserSettings {
  notifications: boolean;
  language: 'ar' | 'en';
  autoSave: boolean;
}

export interface BasicData {
  fullName: string;
  school: string;
  department: string;
  phone: string;
  email: string;
}

// Theme related types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  // Input related colors
  inputBackground: string;
  inputText: string;
  inputPlaceholder: string;
  // Card related colors
  card: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

// Navigation types
export interface TabRoute {
  key: string;
  title: string;
  icon: string;
  route: string;
}

// File management types
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date';
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

// Component prop types
export interface StyleProps {
  style?: object;
  className?: string;
}

export interface IconProps {
  name: string;
  size: number;
  color: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Filter types
export interface FilterOption {
  key: string;
  label: string;
  icon: string;
  count?: number;
}

// Export types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  includeImages?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
} 