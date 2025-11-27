
import type { EXPENSE_CATEGORIES } from './constants';

export type StudentStatus = 'active' | 'inactive';

export interface Student {
  id: string;
  fullName: string;
  birthDate: string;
  schoolGrade: string;
  subjectsOfInterest: string[];
  learningDifficulties: string;
  monthlyFee: number;
  paymentDueDay: number;
  photoUrl: string;
  status: StudentStatus;
  createdAt: string;
  statusChangedAt?: string;
}

export interface Guardian {
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  cpf: string;
}

export interface Registration {
  student: Student;
  guardian: Guardian;
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Payment {
    id: string;
    studentId: string;
    studentName: string;
    amount: number;
    dueDate: string;
    paymentDate?: string;
    status: PaymentStatus;
}

// New types for FINANCIERO 360 - Accounts Payable
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type ExpenseStatus = 'paid' | 'pending' | 'overdue';

export interface Expense {
    id: string;
    description: string;
    amount: number;
    category: ExpenseCategory;
    dueDate: string; // YYYY-MM-DD
    status: ExpenseStatus;
    paymentDate?: string; // YYYY-MM-DD
}

export type Budget = {
    [key in ExpenseCategory]?: number;
};
