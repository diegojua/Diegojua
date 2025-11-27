
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StudentList from './components/StudentList';
import RegistrationForm from './components/RegistrationForm';
import FinancialDashboard from './components/FinancialDashboard';
import Dashboard from './components/Dashboard';
import type { Registration, Student, StudentStatus, Payment, PaymentStatus, Expense, Budget, ExpenseStatus } from './types';

type View = 'dashboard' | 'students' | 'form' | 'financial';

// Mock Data Definitions (Moved outside component for cleaner initialization logic)
const INITIAL_REGISTRATIONS: Registration[] = [
    {
      student: {
        id: '1',
        fullName: 'Lucas Almeida',
        birthDate: '2010-05-15',
        schoolGrade: '8th Grade',
        subjectsOfInterest: ['Matemática'],
        learningDifficulties: 'Struggles with algebraic equations and understanding Newton\'s laws of motion.',
        monthlyFee: 250,
        paymentDueDay: 10,
        photoUrl: `https://picsum.photos/seed/lucas/200`,
        status: 'active',
        createdAt: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      },
      guardian: {
        fullName: 'Fernanda Almeida',
        relationship: 'Mother',
        phone: '(11) 98765-4321',
        email: 'fernanda.a@example.com',
        address: 'Rua das Flores, 123, São Paulo, SP',
        cpf: '123.456.789-00'
      }
    },
    {
        student: {
          id: '2',
          fullName: 'Juliana Costa',
          birthDate: '2012-02-20',
          schoolGrade: '6th Grade',
          subjectsOfInterest: ['Português'],
          learningDifficulties: 'Difficulty with text interpretation and memorizing historical dates.',
          monthlyFee: 220,
          paymentDueDay: 15,
          photoUrl: `https://picsum.photos/seed/juliana/200`,
          status: 'inactive',
          createdAt: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
          statusChangedAt: new Date().toISOString(),
        },
        guardian: {
          fullName: 'Ricardo Costa',
          relationship: 'Father',
          phone: '(21) 91234-5678',
          email: 'ricardo.c@example.com',
          address: 'Avenida Copacabana, 456, Rio de Janeiro, RJ',
          cpf: '111.222.333-44'
        }
    },
     {
        student: {
          id: '3',
          fullName: 'Pedro Oliveira',
          birthDate: '2011-09-01',
          schoolGrade: '7th Grade',
          subjectsOfInterest: ['Geral'],
          learningDifficulties: 'Needs support with organization and study planning.',
          monthlyFee: 200,
          paymentDueDay: 5,
          photoUrl: `https://picsum.photos/seed/pedro/200`,
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        guardian: {
          fullName: 'Márcia Oliveira',
          relationship: 'Mother',
          phone: '(31) 99999-8888',
          email: 'marcia.o@example.com',
          address: 'Rua das Acácias, 789, Belo Horizonte, MG',
          cpf: '555.666.777-88'
        }
    }
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'exp1', description: 'Pagamento de Tutor de Matemática', amount: 1200, category: 'Salários', dueDate: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0], status: 'paid', paymentDate: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0] },
    { id: 'exp2', description: 'Anúncios em Mídias Sociais', amount: 350, category: 'Marketing', dueDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], status: 'overdue' },
    { id: 'exp3', description: 'Compra de canetas e apostilas', amount: 150, category: 'Suprimentos', dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], status: 'pending' },
    { id: 'exp4', description: 'Conta de luz e internet', amount: 180, category: 'Contas de Consumo', dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], status: 'pending' },
    { id: 'exp5', description: 'Licença software de gestão', amount: 99, category: 'Assinaturas de Software', dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0], status: 'pending' },
];

const INITIAL_BUDGETS: Budget = {
    'Salários': 2500,
    'Marketing': 500,
    'Suprimentos': 300,
    'Aluguel': 0,
    'Contas de Consumo': 250,
    'Assinaturas de Software': 150,
    'Desenvolvimento Profissional': 200,
    'Viagens': 100,
    'Impostos': 400,
    'Serviços de Terceiros': 300,
    'Outros': 150,
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  
  // Database / State Initialization with LocalStorage
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    const saved = localStorage.getItem('sysalunos_registrations');
    return saved ? JSON.parse(saved) : INITIAL_REGISTRATIONS;
  });

  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('sysalunos_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('sysalunos_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [budgets, setBudgets] = useState<Budget>(() => {
    const saved = localStorage.getItem('sysalunos_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('sysalunos_registrations', JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem('sysalunos_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('sysalunos_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('sysalunos_budgets', JSON.stringify(budgets));
  }, [budgets]);


  // Effect to generate monthly payments for students
  useEffect(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const activeStudents = registrations.filter(r => r.student.status === 'active');
    
    const newPayments: Payment[] = [];

    activeStudents.forEach(reg => {
      const paymentExists = payments.some(p => p.studentId === reg.student.id && new Date(p.dueDate).getMonth() === currentMonth && new Date(p.dueDate).getFullYear() === currentYear);
      
      if (!paymentExists) {
          // Calculate due date based on student preference and month length
          const dueDay = reg.student.paymentDueDay || 10;
          // Determine the last day of the current month
          const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          // The actual due day is the minimum of preference and last day of month
          const actualDueDay = Math.min(dueDay, lastDayOfMonth);
          
          const dueDate = new Date(currentYear, currentMonth, actualDueDay);
          
          let status: PaymentStatus = 'pending';
          if (dueDate < today && !payments.find(p => p.id === `${reg.student.id}-${currentYear}-${currentMonth}`)?.paymentDate) {
              status = 'overdue';
          }

          newPayments.push({
              id: `${reg.student.id}-${currentYear}-${currentMonth}`,
              studentId: reg.student.id,
              studentName: reg.student.fullName,
              amount: reg.student.monthlyFee,
              dueDate: dueDate.toISOString().split('T')[0],
              status: status,
          });
      }
    });

    const updatedPaymentsWithOverdue = payments.map(p => {
        if (p.status === 'pending') {
            const dueDate = new Date(p.dueDate);
            if(dueDate < today) {
                return { ...p, status: 'overdue' as PaymentStatus };
            }
        }
        return p;
    });

    if (newPayments.length > 0) {
      setPayments(prev => {
          const updatedPayments = [...updatedPaymentsWithOverdue];
          newPayments.forEach(np => {
              if (!updatedPayments.find(up => up.id === np.id)) {
                  updatedPayments.push(np);
              }
          });
          return updatedPayments;
      });
    } else {
      // Avoid infinite loop by checking if state actually changed
      const isDifferent = JSON.stringify(updatedPaymentsWithOverdue) !== JSON.stringify(payments);
      if(isDifferent) {
        setPayments(updatedPaymentsWithOverdue);
      }
    }
  }, [registrations, payments.length]); // Removed full 'payments' dependency to avoid cycles, rely on length or checks


  // Effect to update expense statuses from pending to overdue
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day for accurate comparison

    const updatedExpenses = expenses.map(exp => {
      if (exp.status === 'pending') {
        const dueDate = new Date(exp.dueDate);
        if (dueDate < today) {
          return { ...exp, status: 'overdue' as ExpenseStatus };
        }
      }
      return exp;
    });

    // Only update state if there are actual changes to prevent infinite loops
    if (JSON.stringify(updatedExpenses) !== JSON.stringify(expenses)) {
      setExpenses(updatedExpenses);
    }
  }, [expenses]);


  const handleAddNew = () => {
    setEditingRegistration(null);
    setView('form');
  };

  const handleEdit = (registration: Registration) => {
    setEditingRegistration(registration);
    setView('form');
  };

  const handleCancelForm = () => {
    setEditingRegistration(null);
    setView('dashboard');
  };

  const handleSaveRegistration = (registration: Registration) => {
    if (editingRegistration) {
      setRegistrations(prev => prev.map(reg => 
        reg.student.id === editingRegistration.student.id ? { ...registration, student: { ...registration.student, id: reg.student.id, photoUrl: reg.student.photoUrl, createdAt: reg.student.createdAt } } : reg
      ));
    } else {
      setRegistrations(prev => [
          { ...registration, student: { ...registration.student, status: 'active', id: Date.now().toString(), photoUrl: `https://picsum.photos/seed/${Date.now()}/200`, createdAt: new Date().toISOString() }}, 
          ...prev
      ]);
    }
    setView('students');
    setEditingRegistration(null);
  };
  
  const handleChangeStatus = (studentId: string, status: StudentStatus) => {
    setRegistrations(prev => prev.map(reg => 
      reg.student.id === studentId ? { ...reg, student: { ...reg.student, status, statusChangedAt: new Date().toISOString() } } : reg
    ));
  };
  
  const handleMarkAsPaid = (paymentId: string) => {
    setPayments(prev => prev.map(p => 
      p.id === paymentId ? { ...p, status: 'paid', paymentDate: new Date().toISOString().split('T')[0] } : p
    ));
  };

  const handleImportRegistrations = (importedRegistrations: (Omit<Registration, 'student'> & { student: Omit<Student, 'id' | 'photoUrl' | 'status' | 'createdAt'> })[]) => {
    const newRegistrationsWithIds = importedRegistrations.map((reg, index) => ({
      ...reg,
      student: {
        ...reg.student,
        id: `${Date.now()}-${index}`,
        photoUrl: `https://picsum.photos/seed/${Date.now()}-${reg.student.fullName}/200`,
        status: 'active' as StudentStatus,
        createdAt: new Date().toISOString(),
        paymentDueDay: reg.student.paymentDueDay || 10,
      },
    }));
    setRegistrations(prev => [...newRegistrationsWithIds, ...prev]);
  };
  
  const handleSaveExpense = (expense: Omit<Expense, 'id' | 'status' | 'paymentDate'> | Expense) => {
    if ('id' in expense && expense.id) {
      setExpenses(prev => prev.map(e => (e.id === expense.id ? { ...e, ...expense } : e)));
    } else {
      const newExpense: Expense = { ...expense, id: `exp-${Date.now()}`, status: 'pending' };
      setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
    }
  };

  const handleMarkExpenseAsPaid = (expenseId: string, paymentDate: string) => {
    setExpenses(prev => prev.map(e => 
      e.id === expenseId ? { ...e, status: 'paid', paymentDate } : e
    ));
  };
  
  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };
  
  const handleSaveBudgets = (newBudgets: Budget) => {
    setBudgets(newBudgets);
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
          <Dashboard
            registrations={registrations}
            payments={payments}
            expenses={expenses}
            onAddNewStudent={handleAddNew}
            onViewStudentList={() => setView('students')}
            onViewFinancialDashboard={() => setView('financial')}
            onSaveExpense={handleSaveExpense}
          />
        );
      case 'students':
        return (
          <StudentList 
            registrations={registrations}
            payments={payments}
            onImportRegistrations={handleImportRegistrations}
            onEdit={handleEdit}
            onChangeStatus={handleChangeStatus}
            onConfirmPayment={handleMarkAsPaid}
          />
        );
      case 'financial':
        return (
            <FinancialDashboard
                payments={payments}
                registrations={registrations}
                onMarkAsPaid={handleMarkAsPaid}
                expenses={expenses}
                budgets={budgets}
                onSaveExpense={handleSaveExpense}
                onSaveBudgets={handleSaveBudgets}
                onDeleteExpense={handleDeleteExpense}
                onMarkExpenseAsPaid={handleMarkExpenseAsPaid}
            />
        );
      case 'form':
        return (
           <RegistrationForm 
            initialData={editingRegistration}
            onSave={handleSaveRegistration}
            onCancel={handleCancelForm}
            onSuccess={() => setView('students')}
          />
        );
      default:
        return null;
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header onAddNew={handleAddNew} currentView={view} setView={setView} />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
