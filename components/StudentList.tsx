
import React, { useState, useRef, useMemo } from 'react';
import type { Registration, StudentStatus, Payment } from '../types';
import StudentCard from './StudentCard';
import { UsersIcon, SearchIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, UserPlusIcon, ArchiveBoxIcon, AcademicCapIcon } from './icons';
import { SCHOOL_SUBJECTS } from '../constants';

// Make XLSX available from the global scope, loaded via script tag in index.html
declare var XLSX: any;

interface StudentListProps {
  registrations: Registration[];
  payments: Payment[];
  onImportRegistrations: (registrations: (Omit<Registration, 'student'> & { student: Omit<Registration['student'], 'id' | 'photoUrl' | 'status' | 'createdAt'> })[]) => void;
  onEdit: (registration: Registration) => void;
  onChangeStatus: (studentId: string, status: StudentStatus) => void;
  onConfirmPayment: (paymentId: string) => void;
}

type ActiveTab = 'active' | 'archived';

const StudentList: React.FC<StudentListProps> = ({ registrations, payments, onImportRegistrations, onEdit, onChangeStatus, onConfirmPayment }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('active');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dashboardStats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const newStudentsThisMonth = registrations.filter(r => {
      const createdAt = new Date(r.student.createdAt);
      return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    }).length;
    
    const archivedStudentsThisMonth = registrations.filter(r => {
      if (!r.student.statusChangedAt || r.student.status !== 'inactive') return false;
      const changedAt = new Date(r.student.statusChangedAt);
      return changedAt.getMonth() === currentMonth && changedAt.getFullYear() === currentYear;
    }).length;

    const subjectDistribution = registrations
      .filter(r => r.student.status === 'active')
      .flatMap(r => r.student.subjectsOfInterest)
      .reduce((acc, subject) => {
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
    const maxStudentsInSubject = Math.max(...(Object.values(subjectDistribution) as number[]), 0);

    return { newStudentsThisMonth, archivedStudentsThisMonth, subjectDistribution, maxStudentsInSubject };
  }, [registrations]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const activeRegistrations = registrations.filter(reg => reg.student.status === 'active');
  const archivedRegistrations = registrations.filter(reg => reg.student.status !== 'active');
  
  const getFilteredRegistrations = (list: Registration[]) => {
    return list.filter(reg => {
      const studentName = reg.student.fullName.toLowerCase();
      const guardianName = reg.guardian.fullName.toLowerCase();
      const query = searchQuery.toLowerCase();
      return studentName.includes(query) || guardianName.includes(query);
    });
  };
  
  const displayedRegistrations = activeTab === 'active' ? getFilteredRegistrations(activeRegistrations) : getFilteredRegistrations(archivedRegistrations);

  // Helper to get the latest payment for a student
  const getLastPayment = (studentId: string) => {
    const studentPayments = payments
        .filter(p => p.studentId === studentId)
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    return studentPayments.length > 0 ? studentPayments[0] : undefined;
  };

  const handleExport = () => {
    const dataToExport = displayedRegistrations.map(reg => ({
      'Nome do Aluno': reg.student.fullName,
      'Data de Nascimento': reg.student.birthDate,
      'Ano Escolar': reg.student.schoolGrade,
      'Valor da Mensalidade': reg.student.monthlyFee,
      'Dia do Vencimento': reg.student.paymentDueDay,
      'Matérias de Interesse': reg.student.subjectsOfInterest.join(', '),
      'Dificuldades': reg.student.learningDifficulties,
      'Status': reg.student.status,
      'Nome do Responsável': reg.guardian.fullName,
      'Parentesco': reg.guardian.relationship,
      'Telefone': reg.guardian.phone,
      'Email': reg.guardian.email,
      'Endereço': reg.guardian.address,
      'CPF Responsável': reg.guardian.cpf,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alunos");
    XLSX.writeFile(workbook, `cadastro_alunos_${activeTab}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const imported = json.map((row: any) => ({
          student: {
            fullName: row['Nome do Aluno'] || '',
            birthDate: row['Data de Nascimento'] || '',
            schoolGrade: row['Ano Escolar'] || '',
            monthlyFee: Number(row['Valor da Mensalidade']) || 0,
            paymentDueDay: Number(row['Dia do Vencimento']) || 10,
            subjectsOfInterest: (row['Matérias de Interesse'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
            learningDifficulties: row['Dificuldades'] || '',
          },
          guardian: {
            fullName: row['Nome do Responsável'] || '',
            relationship: row['Parentesco'] || '',
            phone: String(row['Telefone'] || ''),
            email: row['Email'] || '',
            address: row['Endereço'] || '',
            cpf: String(row['CPF Responsável'] || ''),
          }
        })).filter(reg => reg.student.fullName && reg.guardian.fullName);

        onImportRegistrations(imported);
        
      } catch (error) {
        console.error("Error processing the Excel file:", error);
        alert("Ocorreu um erro ao processar o arquivo. Verifique se o formato está correto.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };
  
  const renderEmptyState = (title: string, message: string) => (
    <div className="text-center py-20 px-6 bg-white rounded-lg shadow-md col-span-full">
      <UsersIcon className="mx-auto h-16 w-16 text-gray-400" />
      <h2 className="mt-4 text-2xl font-semibold text-gray-700">{title}</h2>
      <p className="mt-2 text-gray-500">{message}</p>
    </div>
  );
  
  const KPI_CARDS = [
    { title: 'Novos Alunos no Mês', value: dashboardStats.newStudentsThisMonth, icon: UserPlusIcon, color: 'text-green-600' },
    { title: 'Alunos Arquivados no Mês', value: dashboardStats.archivedStudentsThisMonth, icon: ArchiveBoxIcon, color: 'text-red-600' },
    { title: 'Total de Alunos Ativos', value: activeRegistrations.length, icon: UsersIcon, color: 'text-blue-700' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {KPI_CARDS.map(card => (
            <div key={card.title} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                <div className={`p-3 rounded-full bg-opacity-20 ${card.color.replace('text-', 'bg-')}`}>
                   <card.icon className={`h-8 w-8 ${card.color}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                </div>
            </div>
          ))}
          <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-700" />
              Principais Áreas de Foco (Alunos Ativos)
            </h3>
            <div className="space-y-2">
              {SCHOOL_SUBJECTS.map(subject => {
                const count = dashboardStats.subjectDistribution[subject] || 0;
                const percentage = dashboardStats.maxStudentsInSubject > 0 ? (count / dashboardStats.maxStudentsInSubject) * 100 : 0;
                return (
                  <div key={subject} className="flex items-center">
                    <span className="text-sm font-medium text-gray-600 w-28 truncate">{subject}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 mr-2">
                      <div className="bg-blue-700 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{count}</span>
                  </div>
                )
              })}
               {Object.keys(dashboardStats.subjectDistribution).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum aluno ativo com matérias selecionadas.</p>
              )}
            </div>
          </div>
      </div>
    
      {/* Student List Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-auto flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Pesquisar por aluno..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xlsm"
              className="hidden"
            />
            <button onClick={handleImportClick} className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition">
              <ArrowUpTrayIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <button onClick={handleExport} disabled={displayedRegistrations.length === 0} className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              <button onClick={() => setActiveTab('active')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'active' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                Alunos Ativos
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{activeRegistrations.length}</span>
              </button>
              <button onClick={() => setActiveTab('archived')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'archived' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                Alunos Arquivados
                <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{archivedRegistrations.length}</span>
              </button>
            </nav>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          { (registrations.length === 0 && activeTab === 'active') && renderEmptyState("Nenhum aluno cadastrado", "Clique em \"Novo Aluno\" para começar a cadastrar.") }
          { (activeTab === 'active' && activeRegistrations.length > 0 && displayedRegistrations.length === 0) && renderEmptyState("Nenhum resultado encontrado", "Tente ajustar os termos da sua pesquisa.") }
          { (activeTab === 'archived' && archivedRegistrations.length === 0) && renderEmptyState("Nenhum aluno arquivado", "Alunos marcados como inativos aparecerão aqui.") }
          { (activeTab === 'archived' && archivedRegistrations.length > 0 && displayedRegistrations.length === 0) && renderEmptyState("Nenhum resultado encontrado", "Tente ajustar os termos da sua pesquisa.") }
          
          {displayedRegistrations.map((reg) => (
              <StudentCard 
                key={reg.student.id} 
                registration={reg}
                lastPayment={getLastPayment(reg.student.id)}
                onEdit={onEdit}
                onChangeStatus={onChangeStatus}
                onConfirmPayment={onConfirmPayment}
              />
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default StudentList;
