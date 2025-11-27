
import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import type { Payment, Registration, Expense, Budget, ExpenseCategory, ExpenseStatus } from '../types';
import { BanknotesIcon, ChartPieIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon, ReceiptPercentIcon, Cog6ToothIcon, TagIcon, XMarkIcon, PlusCircleIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, SearchIcon, CalendarDaysIcon, FunnelIcon, ChartBarIcon, CurrencyDollarIcon } from './icons';
import { EXPENSE_CATEGORIES } from '../constants';


interface FinancialDashboardProps {
    payments: Payment[];
    registrations: Registration[];
    expenses: Expense[];
    budgets: Budget;
    onMarkAsPaid: (paymentId: string) => void;
    onSaveExpense: (expense: Omit<Expense, 'id' | 'status' | 'paymentDate'> | Expense) => void;
    onDeleteExpense: (expenseId: string) => void;
    onSaveBudgets: (budgets: Budget) => void;
    onMarkExpenseAsPaid: (expenseId: string, paymentDate: string) => void;
}

type FinancialView = 'revenue' | 'expenses' | 'budget';

// Expense Add/Edit Modal Component
const ExpenseModal = ({ 
    initialData, 
    onSave, 
    onClose 
}: { 
    initialData: Omit<Expense, 'id' | 'status' | 'paymentDate'> | Expense | null;
    onSave: (expense: Omit<Expense, 'id' | 'status' | 'paymentDate'> | Expense) => void;
    onClose: () => void;
}) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [category, setCategory] = useState<ExpenseCategory>('Outros');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

    const isEditing = initialData !== null && 'id' in initialData;

    useEffect(() => {
        if (initialData) {
            setDescription(initialData.description);
            setAmount(initialData.amount);
            setCategory(initialData.category);
            setDueDate(initialData.dueDate);
        }
    }, [initialData]);

    const handleSave = (e: FormEvent) => {
        e.preventDefault();
        if(!description || !amount || !category || !dueDate) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        
        const expenseData = {
            description,
            amount: Number(amount),
            category,
            dueDate,
        };

        if(isEditing) {
            onSave({ ...(initialData as Expense), ...expenseData });
        } else {
            onSave(expenseData);
        }
        onClose();
    }

    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">{isEditing ? 'Editar Conta a Pagar' : 'Adicionar Nova Conta a Pagar'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label htmlFor="exp-desc" className="block text-sm font-medium text-gray-700">Descrição</label>
                <input type="text" id="exp-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="exp-amount" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                    <input type="number" id="exp-amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                </div>
                <div>
                    <label htmlFor="exp-date" className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                    <input type="date" id="exp-date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required/>
                </div>
            </div>
            <div>
                <label htmlFor="exp-category" className="block text-sm font-medium text-gray-700">Categoria</label>
                <select id="exp-category" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className="pt-4 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800">{isEditing ? 'Salvar Alterações' : 'Salvar Conta'}</button>
            </div>
        </form>
        </div>
    </div>
    );
}

// Mark as Paid Modal
const MarkAsPaidModal = ({
    expense,
    onConfirm,
    onClose,
}: {
    expense: Expense;
    onConfirm: (expenseId: string, paymentDate: string) => void;
    onClose: () => void;
}) => {
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const handleConfirm = () => {
        onConfirm(expense.id, paymentDate);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Confirmar Pagamento</h3>
                <div className="mt-4">
                    <p className="text-sm text-gray-600">
                        Você está confirmando o pagamento de{' '}
                        <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}</span> para{' '}
                        <span className="font-bold">{expense.description}</span>.
                    </p>
                    <div className="mt-4">
                        <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700">Data do Pagamento Efetivo</label>
                        <input
                            type="date"
                            id="payment-date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="mt-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-700 text-base font-medium text-white hover:bg-blue-800 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleConfirm}
                    >
                        Confirmar Pagamento
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

const BudgetModal = ({ 
    initialBudgets, 
    onSave, 
    onClose 
}: { 
    initialBudgets: Budget;
    onSave: (budgets: Budget) => void;
    onClose: () => void;
}) => {
    const [localBudgets, setLocalBudgets] = useState(initialBudgets);

    const handleBudgetChange = (category: ExpenseCategory, value: string) => {
        const amount = value === '' ? 0 : parseFloat(value);
        if (!isNaN(amount)) {
            setLocalBudgets(prev => ({
                ...prev,
                [category]: amount,
            }));
        }
    };

    const handleSave = () => {
        onSave(localBudgets);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Cog6ToothIcon className="h-6 w-6 mr-2" />
                        Definir Orçamento Mensal por Categoria
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                    {EXPENSE_CATEGORIES.map(category => (
                        <div key={category} className="grid grid-cols-3 items-center gap-4">
                            <label htmlFor={`budget-${category}`} className="text-sm font-medium text-gray-700 col-span-1">{category}</label>
                            <div className="relative col-span-2">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">R$</span>
                                <input
                                    type="number"
                                    id={`budget-${category}`}
                                    value={localBudgets[category] || ''}
                                    onChange={e => handleBudgetChange(category, e.target.value)}
                                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-6 mt-4 border-t border-gray-200 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                    <button type="button" onClick={handleSave} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800">Salvar Orçamento</button>
                </div>
            </div>
        </div>
    );
};


const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ payments, registrations, expenses, budgets, onMarkAsPaid, onSaveExpense, onDeleteExpense, onSaveBudgets, onMarkExpenseAsPaid }) => {
    const [activeTab, setActiveTab] = useState<FinancialView>('revenue');
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
    const [expenseToPay, setExpenseToPay] = useState<Expense | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('pending');
    const [searchFilter, setSearchFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [revenueMonthFilter, setRevenueMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    const financialSummary = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const totalRevenue = payments
            .filter(p => p.status === 'paid' && p.paymentDate && new Date(p.paymentDate).getMonth() === currentMonth && new Date(p.paymentDate).getFullYear() === currentYear)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalExpenses = expenses
            .filter(e => e.status === 'paid' && e.paymentDate && new Date(e.paymentDate).getMonth() === currentMonth && new Date(e.paymentDate).getFullYear() === currentYear)
            .reduce((sum, e) => sum + e.amount, 0);
        
        const netProfit = totalRevenue - totalExpenses;
        
        const pendingRevenue = payments
             .filter(p => p.status !== 'paid' && new Date(p.dueDate).getMonth() === currentMonth && new Date(p.dueDate).getFullYear() === currentYear)
             .reduce((sum, p) => sum + p.amount, 0);

        return { totalRevenue, totalExpenses, netProfit, pendingRevenue };
    }, [payments, registrations, expenses]);
    
    // Revenue Logic
    const revenueData = useMemo(() => {
        const [year, month] = revenueMonthFilter.split('-').map(Number);
        
        const filteredPayments = payments.filter(p => {
            const d = new Date(p.dueDate);
            return d.getMonth() === month - 1 && d.getFullYear() === year;
        });

        const statusCounts = {
            paid: filteredPayments.filter(p => p.status === 'paid').length,
            pending: filteredPayments.filter(p => p.status === 'pending').length,
            overdue: filteredPayments.filter(p => p.status === 'overdue').length,
            total: filteredPayments.length
        };
        
        return { list: filteredPayments, stats: statusCounts };
    }, [payments, revenueMonthFilter]);

    // Budget Logic
    const budgetAnalysis = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const expensesThisMonth = expenses.filter(e => {
            const d = new Date(e.dueDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        return EXPENSE_CATEGORIES.map(category => {
            const budgeted = budgets[category] || 0;
            const actual = expensesThisMonth
                .filter(e => e.category === category)
                .reduce((sum, e) => sum + e.amount, 0);
            
            return {
                category,
                budgeted,
                actual,
                diff: budgeted - actual,
                percent: budgeted > 0 ? (actual / budgeted) * 100 : 0
            };
        }).sort((a, b) => b.percent - a.percent);
    }, [expenses, budgets]);

    // Accounts Payable KPIs and filtered list
    const accountsPayable = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const overdueAmount = expenses.filter(e => e.status === 'overdue').reduce((sum, e) => sum + e.amount, 0);
        const dueIn7DaysAmount = expenses.filter(e => {
            const dueDate = new Date(e.dueDate);
            return e.status === 'pending' && dueDate >= today && dueDate <= sevenDaysFromNow;
        }).reduce((sum, e) => sum + e.amount, 0);

        const filtered = expenses.filter(e => {
            const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
            const matchesSearch = e.description.toLowerCase().includes(searchFilter.toLowerCase());
            const dueDate = new Date(e.dueDate);
            const matchesDateRange = (!dateRange.start || dueDate >= new Date(dateRange.start)) && (!dateRange.end || dueDate <= new Date(dateRange.end));
            return matchesStatus && matchesSearch && matchesDateRange;
        });

        return { overdueAmount, dueIn7DaysAmount, filteredList: filtered };
    }, [expenses, statusFilter, searchFilter, dateRange]);
    
    // Expense Categories Chart Data
    const expenseCategoriesChart = useMemo(() => {
         const today = new Date();
         const currentMonth = today.getMonth();
         const currentYear = today.getFullYear();

         const expensesThisMonth = expenses.filter(e => {
            const d = new Date(e.dueDate);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        
        const total = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
        
        const data = EXPENSE_CATEGORIES.map(cat => {
            const amount = expensesThisMonth.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
            return { category: cat, amount, percentage: total > 0 ? (amount / total) * 100 : 0 };
        }).filter(item => item.amount > 0).sort((a, b) => b.amount - a.amount);

        return { data, total };
    }, [expenses]);


    const handleOpenExpenseModal = (expense: Expense | null) => {
        setEditingExpense(expense);
        setShowExpenseModal(true);
    };

    const handleCloseExpenseModal = () => {
        setShowExpenseModal(false);
        setEditingExpense(null);
    };

    const handleRequestDelete = (expenseId: string) => {
        setExpenseToDelete(expenseId);
    };

    const handleConfirmDelete = () => {
        if (expenseToDelete) {
            onDeleteExpense(expenseToDelete);
            setExpenseToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setExpenseToDelete(null);
    };
    
    const getStatusBadge = (status: ExpenseStatus | 'paid' | 'pending' | 'overdue') => {
        switch (status) {
            case 'paid': return <span className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800"><CheckCircleIcon className="h-4 w-4 mr-1"/> Pago</span>;
            case 'pending': return <span className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800"><ClockIcon className="h-4 w-4 mr-1"/> Pendente</span>;
            case 'overdue': return <span className="flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800"><ExclamationCircleIcon className="h-4 w-4 mr-1"/> Vencido</span>;
        }
    };
    
    const getRowStyle = (expense: Expense) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        const dueDate = new Date(expense.dueDate);

        if (expense.status === 'overdue') return 'bg-red-50';
        if (expense.status === 'pending' && dueDate <= sevenDaysFromNow && dueDate >= today) return 'border-l-4 border-yellow-400';
        if (expense.status === 'pending') return 'bg-blue-50';
        return 'bg-white';
    };
    
    return (
        <div className="space-y-8">
            {/* All modals here */}
            {showBudgetModal && <BudgetModal initialBudgets={budgets} onSave={onSaveBudgets} onClose={() => setShowBudgetModal(false)} />}
            {showExpenseModal && <ExpenseModal initialData={editingExpense} onSave={onSaveExpense} onClose={handleCloseExpenseModal} />}
            {expenseToPay && <MarkAsPaidModal expense={expenseToPay} onConfirm={onMarkExpenseAsPaid} onClose={() => setExpenseToPay(null)} />}
            {expenseToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Excluir Conta</h3>
                                <div className="mt-2"><p className="text-sm text-gray-500">Tem certeza que deseja excluir esta conta a pagar? Esta ação não pode ser desfeita.</p></div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm" onClick={handleConfirmDelete}>Excluir</button>
                            <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm" onClick={handleCancelDelete}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Receita Total (Mês)</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(financialSummary.totalRevenue)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                            <ArrowTrendingUpIcon className="h-6 w-6" />
                        </div>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Despesa Total (Mês)</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(financialSummary.totalExpenses)}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full text-red-600">
                            <ArrowTrendingDownIcon className="h-6 w-6" />
                        </div>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Saldo Líquido</p>
                            <p className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(financialSummary.netProfit)}</p>
                        </div>
                         <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <CurrencyDollarIcon className="h-6 w-6" />
                        </div>
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                     <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">A Receber (Mês)</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(financialSummary.pendingRevenue)}</p>
                        </div>
                         <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                            <BanknotesIcon className="h-6 w-6" />
                        </div>
                    </div>
                 </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setActiveTab('revenue')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'revenue' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            <ArrowTrendingUpIcon className="h-5 w-5 mr-2"/> Receitas
                        </button>
                        <button onClick={() => setActiveTab('expenses')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'expenses' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            <ArrowTrendingDownIcon className="h-5 w-5 mr-2"/> Despesas
                        </button>
                        <button onClick={() => setActiveTab('budget')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'budget' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                             <ChartPieIcon className="h-5 w-5 mr-2"/> Orçamento
                        </button>
                    </nav>
                </div>

                {activeTab === 'revenue' && (
                    <div className="space-y-6">
                         {/* Controls */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-700 font-medium">Mês de Referência:</span>
                                <input 
                                    type="month" 
                                    value={revenueMonthFilter} 
                                    onChange={(e) => setRevenueMonthFilter(e.target.value)} 
                                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex space-x-4 text-sm text-gray-600">
                                <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>Pagos: {revenueData.stats.paid}</span>
                                <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>Vencidos: {revenueData.stats.overdue}</span>
                                <span className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>Pendentes: {revenueData.stats.pending}</span>
                            </div>
                        </div>

                         {/* Chart Bar Visual */}
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden flex">
                            <div className="bg-green-500 h-4" style={{ width: `${(revenueData.stats.paid / revenueData.stats.total) * 100}%` }} title="Pagos"></div>
                            <div className="bg-red-500 h-4" style={{ width: `${(revenueData.stats.overdue / revenueData.stats.total) * 100}%` }} title="Vencidos"></div>
                             <div className="bg-blue-400 h-4" style={{ width: `${(revenueData.stats.pending / revenueData.stats.total) * 100}%` }} title="Pendentes"></div>
                        </div>

                        {/* Revenue Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {revenueData.list.map(payment => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.studentName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(payment.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{formatCurrency(payment.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {payment.status !== 'paid' && (
                                                    <button 
                                                        onClick={() => onMarkAsPaid(payment.id)} 
                                                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md"
                                                    >
                                                        Confirmar Recebimento
                                                    </button>
                                                )}
                                                {payment.status === 'paid' && payment.paymentDate && (
                                                     <span className="text-green-600 text-xs">Pago em {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {revenueData.list.length === 0 && (
                                        <tr><td colSpan={5} className="text-center py-10 text-gray-500">Nenhum registro encontrado para este mês.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {activeTab === 'expenses' && (
                    <div className="space-y-6">
                        {/* KPIs de Risco */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                <p className="text-sm font-medium text-red-800">Total Vencido</p>
                                <p className="text-2xl font-bold text-red-900">{formatCurrency(accountsPayable.overdueAmount)}</p>
                            </div>
                             <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                                <p className="text-sm font-medium text-yellow-800">A Vencer (7 dias)</p>
                                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(accountsPayable.dueIn7DaysAmount)}</p>
                            </div>
                             <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <p className="text-sm font-medium text-blue-800">Total Despesas (Mês)</p>
                                <p className="text-2xl font-bold text-blue-900">{formatCurrency(expenseCategoriesChart.total)}</p>
                            </div>
                        </div>

                         {/* Expense Category Chart */}
                        {expenseCategoriesChart.data.length > 0 && (
                             <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center"><ChartBarIcon className="h-4 w-4 mr-2"/>Distribuição de Gastos (Este Mês)</h4>
                                <div className="space-y-3">
                                    {expenseCategoriesChart.data.slice(0, 5).map(item => (
                                        <div key={item.category}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{item.category}</span>
                                                <span className="font-medium">{formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                        
                        {/* Barra de Filtros e Ações */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex-grow w-full md:w-auto">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="h-5 w-5 text-gray-400" /></span>
                                    <input type="text" placeholder="Buscar por descrição..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="py-2 px-3 border border-gray-300 rounded-lg shadow-sm text-sm" />
                                <span className="text-gray-500">até</span>
                                <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="py-2 px-3 border border-gray-300 rounded-lg shadow-sm text-sm" />
                            </div>
                             <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border overflow-x-auto">
                                <button onClick={() => setStatusFilter('pending')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${statusFilter === 'pending' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Pendente</button>
                                <button onClick={() => setStatusFilter('paid')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${statusFilter === 'paid' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Pago</button>
                                <button onClick={() => setStatusFilter('overdue')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${statusFilter === 'overdue' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Vencido</button>
                                <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 text-sm font-medium rounded-md whitespace-nowrap ${statusFilter === 'all' ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Todos</button>
                            </div>
                            <button onClick={() => handleOpenExpenseModal(null)} className="flex items-center space-x-2 bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-800 whitespace-nowrap"><PlusCircleIcon className="h-5 w-5" /><span>Nova Conta</span></button>
                        </div>

                        {/* Tabela de Contas a Pagar */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-10 px-4 py-3"></th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {accountsPayable.filteredList.map(expense => (
                                        <tr key={expense.id} className={getRowStyle(expense)}>
                                            <td className="px-4 py-4"><div className={`h-2.5 w-2.5 rounded-full ${expense.status === 'paid' ? 'bg-green-500' : expense.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'}`}></div></td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                                                <div className="text-xs text-gray-500 flex items-center mt-1"><TagIcon className="h-3 w-3 mr-1"/>{expense.category}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(expense.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{formatCurrency(expense.amount)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(expense.status)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                                {expense.status !== 'paid' && <button onClick={() => setExpenseToPay(expense)} className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-semibold hover:bg-green-200 transition-colors">Pagar</button>}
                                                <button onClick={() => handleOpenExpenseModal(expense)} className="text-blue-700 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50" title="Editar"><PencilIcon className="h-5 w-5 inline"/></button>
                                                <button onClick={() => handleRequestDelete(expense.id)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50" title="Excluir"><TrashIcon className="h-5 w-5 inline"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {accountsPayable.filteredList.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma conta encontrada com os filtros atuais.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'budget' && (
                    <div>
                         <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Análise de Orçamento (Mensal)</h3>
                                <p className="text-sm text-gray-500">Comparativo de gastos planejados vs. realizados no mês atual.</p>
                            </div>
                            <button onClick={() => setShowBudgetModal(true)} className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 shadow-sm">
                                <Cog6ToothIcon className="h-5 w-5" />
                                <span>Configurar Metas</span>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {budgetAnalysis.map((item) => (
                                <div key={item.category} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-semibold text-gray-800 flex items-center">
                                            <TagIcon className="h-4 w-4 mr-2 text-blue-500"/>
                                            {item.category}
                                        </h4>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.diff >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.diff >= 0 ? 'Dentro da meta' : 'Estourado'}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-500">Realizado</span>
                                            <span className="font-bold text-gray-900">{formatCurrency(item.actual)}</span>
                                        </div>
                                         <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>Meta</span>
                                            <span>{formatCurrency(item.budgeted)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className={`h-2.5 rounded-full ${item.percent > 100 ? 'bg-red-500' : item.percent > 80 ? 'bg-yellow-400' : 'bg-green-500'}`} 
                                                style={{ width: `${Math.min(item.percent, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right text-xs text-gray-500">
                                        {item.diff >= 0 
                                            ? `Resta ${formatCurrency(item.diff)}` 
                                            : `Excedeu em ${formatCurrency(Math.abs(item.diff))}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialDashboard;
