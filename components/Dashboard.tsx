
import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import type { Registration, Payment, Expense, ExpenseCategory } from '../types';
import { UsersIcon, UserPlusIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartPieIcon, PlusCircleIcon, BanknotesIcon, XMarkIcon, CurrencyDollarIcon, CalendarDaysIcon, ExclamationCircleIcon } from './icons';
import { EXPENSE_CATEGORIES } from '../constants';

interface DashboardProps {
    registrations: Registration[];
    payments: Payment[];
    expenses: Expense[];
    onAddNewStudent: () => void;
    onViewStudentList: () => void;
    onViewFinancialDashboard: () => void;
    onSaveExpense: (expense: Omit<Expense, 'id' | 'status' | 'paymentDate'>) => void;
}

// Reusable Expense Modal
const ExpenseModal = ({ onClose, onSave }: { onClose: () => void; onSave: (expense: Omit<Expense, 'id' | 'status' | 'paymentDate'>) => void; }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [category, setCategory] = useState<ExpenseCategory>('Outros');
    const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSave = (e: FormEvent) => {
        e.preventDefault();
        if(!description || !amount || !category || !dueDate) {
            alert("Por favor, preencha todos os campos.");
            return;
        }
        onSave({ description, amount: Number(amount), category, dueDate });
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Adicionar Nova Despesa</h3>
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
                        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800">Salvar Despesa</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const Dashboard: React.FC<DashboardProps> = ({ registrations, payments, expenses, onAddNewStudent, onViewStudentList, onViewFinancialDashboard, onSaveExpense }) => {
    
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const studentStats = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const activeStudents = registrations.filter(r => r.student.status === 'active').length;
        const newStudentsThisMonth = registrations.filter(r => {
            const createdAt = new Date(r.student.createdAt);
            return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
        }).length;
        
        const latestRegistrations = [...registrations]
            .sort((a, b) => new Date(b.student.createdAt).getTime() - new Date(a.student.createdAt).getTime())
            .slice(0, 5);
        
        return { activeStudents, newStudentsThisMonth, latestRegistrations };
    }, [registrations]);

    const financialStats = useMemo(() => {
        const today = new Date();
        // Normalize today to start of day for correct date comparison
        today.setHours(0, 0, 0, 0);

        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const totalRevenue = payments
            .filter(p => p.status === 'paid' && new Date(p.paymentDate!).getMonth() === currentMonth && new Date(p.paymentDate!).getFullYear() === currentYear)
            .reduce((sum, p) => sum + p.amount, 0);

        const totalExpenses = expenses
            .filter(e => e.status === 'paid' && e.paymentDate && new Date(e.paymentDate).getMonth() === currentMonth && new Date(e.paymentDate).getFullYear() === currentYear)
            .reduce((sum, e) => sum + e.amount, 0);
        
        const netProfit = totalRevenue - totalExpenses;
        
        // Projected Revenue: Sum of monthly fees of all active students
        const projectedRevenue = registrations
            .filter(r => r.student.status === 'active')
            .reduce((sum, r) => sum + r.student.monthlyFee, 0);

        // Upcoming Payments: Payments due in the next 7 days
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const upcomingPaymentsList = payments.filter(p => {
             if (p.status === 'paid') return false;
             // Handle YYYY-MM-DD string to local Date comparison
             const [y, m, d] = p.dueDate.split('-').map(Number);
             const dueDate = new Date(y, m - 1, d);
             return dueDate >= today && dueDate <= nextWeek;
        });
        
        const upcomingPaymentsCount = upcomingPaymentsList.length;
        const upcomingPaymentsTotal = upcomingPaymentsList.reduce((sum, p) => sum + p.amount, 0);

        // Overdue Expenses
        const overdueExpensesList = expenses.filter(e => e.status === 'overdue');
        const overdueExpensesCount = overdueExpensesList.length;
        const overdueExpensesTotal = overdueExpensesList.reduce((sum, e) => sum + e.amount, 0);

        return { 
            totalRevenue, 
            totalExpenses, 
            netProfit, 
            projectedRevenue,
            upcomingPaymentsCount,
            upcomingPaymentsTotal,
            overdueExpensesCount,
            overdueExpensesTotal
        };
    }, [payments, expenses, registrations]);

    const chartData = {
        revenue: financialStats.totalRevenue,
        expenses: financialStats.totalExpenses,
        max: Math.max(financialStats.totalRevenue, financialStats.totalExpenses, 1), // Avoid division by zero
    };


    return (
      <div className="space-y-8">
        {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} onSave={onSaveExpense} />}
        
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Projected Revenue */}
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-blue-500">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                    <CurrencyDollarIcon className="h-8 w-8" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Receita Projetada (Mensal)</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(financialStats.projectedRevenue)}</p>
                    <p className="text-xs text-gray-400">Baseada em alunos ativos</p>
                </div>
            </div>

            {/* Upcoming Payments */}
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-yellow-500">
                <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                    <CalendarDaysIcon className="h-8 w-8" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Pagamentos Futuros (7 dias)</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(financialStats.upcomingPaymentsTotal)}</p>
                    <p className="text-xs text-gray-400">{financialStats.upcomingPaymentsCount} a receber</p>
                </div>
            </div>

            {/* Overdue Expenses */}
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 border-red-500">
                <div className="p-3 bg-red-100 rounded-full text-red-600">
                    <ExclamationCircleIcon className="h-8 w-8" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Despesas em Atraso</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(financialStats.overdueExpensesTotal)}</p>
                    <p className="text-xs text-gray-400">{financialStats.overdueExpensesCount} contas</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Student Management Block */}
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <UsersIcon className="h-6 w-6 mr-3 text-blue-700" />
                    Gestão de Alunos
                </h2>
                <button onClick={onViewStudentList} className="text-sm font-semibold text-blue-700 hover:underline">Ver Todos</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Alunos Ativos</p>
                    <p className="text-3xl font-bold text-blue-900">{studentStats.activeStudents}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Novos Alunos no Mês</p>
                    <p className="text-3xl font-bold text-green-900">+{studentStats.newStudentsThisMonth}</p>
                </div>
            </div>
            
            <button
              onClick={onAddNewStudent}
              className="w-full flex items-center justify-center space-x-2 bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform transform hover:scale-105"
            >
              <UserPlusIcon className="h-6 w-6" />
              <span>Novo Cadastro de Aluno</span>
            </button>
            
            <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Últimos Cadastros</h3>
                <div className="space-y-2">
                    {studentStats.latestRegistrations.length > 0 ? studentStats.latestRegistrations.map(reg => (
                        <div key={reg.student.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <div className="flex items-center space-x-3">
                                <img src={reg.student.photoUrl} alt={reg.student.fullName} className="h-8 w-8 rounded-full object-cover" />
                                <span className="text-sm font-medium text-gray-700">{reg.student.fullName}</span>
                            </div>
                            <span className="text-xs text-gray-400">{new Date(reg.student.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                    )) : <p className="text-sm text-gray-400 text-center py-4">Nenhum aluno cadastrado ainda.</p>}
                </div>
            </div>
          </div>

          {/* Financial Health Block */}
          <div className="bg-white p-6 rounded-lg shadow-md flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <BanknotesIcon className="h-6 w-6 mr-3 text-green-600" />
                    Saúde Financeira
                </h2>
                 <button onClick={onViewFinancialDashboard} className="text-sm font-semibold text-blue-700 hover:underline">Ver Detalhes</button>
            </div>
            
             <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${financialStats.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-sm font-medium ${financialStats.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>Lucro Líquido (Mês)</p>
                    <p className={`text-3xl font-bold ${financialStats.netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>{formatCurrency(financialStats.netProfit)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Total de Despesas (Mês)</p>
                    <p className="text-3xl font-bold text-red-900">{formatCurrency(financialStats.totalExpenses)}</p>
                </div>
            </div>
            
             <button
                onClick={() => setShowExpenseModal(true)}
                className="w-full flex items-center justify-center space-x-2 bg-white text-gray-700 px-4 py-3 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition"
                >
                <PlusCircleIcon className="h-6 w-6" />
                <span>Adicionar Nova Despesa</span>
            </button>
            
            <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">Comparativo Financeiro (Mês)</h3>
                <div className="bg-gray-50 p-6 rounded-lg flex items-end justify-around h-64 relative border border-gray-100">
                     {/* Y-axis grid lines for visual reference */}
                     <div className="absolute inset-0 px-6 pb-6 flex flex-col justify-between pointer-events-none">
                        <div className="border-t border-gray-200 w-full h-0"></div>
                        <div className="border-t border-gray-200 w-full h-0 border-dashed opacity-50"></div>
                        <div className="border-t border-gray-200 w-full h-0 border-dashed opacity-50"></div>
                        <div className="border-t border-gray-200 w-full h-0 border-dashed opacity-50"></div>
                        <div className="border-b border-gray-200 w-full h-0"></div>
                     </div>

                    {/* Revenue Bar */}
                    <div className="flex flex-col items-center group w-24 z-10">
                         <div className="mb-2 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatCurrency(chartData.revenue)}
                         </div>
                         <div 
                            className="w-full bg-green-500 rounded-t-md transition-all duration-700 ease-out hover:bg-green-600 shadow-sm"
                            style={{ height: `${(chartData.revenue / chartData.max) * 80 + 1}%` }} 
                         ></div>
                         <span className="mt-3 text-sm font-semibold text-gray-600">Receitas</span>
                         <span className="text-xs text-gray-500 font-medium">{formatCurrency(chartData.revenue)}</span>
                    </div>

                    {/* Expenses Bar */}
                    <div className="flex flex-col items-center group w-24 z-10">
                         <div className="mb-2 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                             {formatCurrency(chartData.expenses)}
                         </div>
                         <div 
                            className="w-full bg-red-500 rounded-t-md transition-all duration-700 ease-out hover:bg-red-600 shadow-sm"
                            style={{ height: `${(chartData.expenses / chartData.max) * 80 + 1}%` }}
                         ></div>
                         <span className="mt-3 text-sm font-semibold text-gray-600">Despesas</span>
                         <span className="text-xs text-gray-500 font-medium">{formatCurrency(chartData.expenses)}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
}

export default Dashboard;
