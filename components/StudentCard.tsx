
import React from 'react';
import type { Registration, StudentStatus, Payment } from '../types';
import { UserIcon, BookOpenIcon, ShieldCheckIcon, PhoneIcon, PencilIcon, ArchiveBoxIcon, ArrowUturnLeftIcon, CurrencyDollarIcon, BanknotesIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from './icons';

interface StudentCardProps {
  registration: Registration;
  lastPayment?: Payment;
  onEdit: (registration: Registration) => void;
  onChangeStatus: (studentId: string, status: StudentStatus) => void;
  onConfirmPayment: (paymentId: string) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ registration, lastPayment, onEdit, onChangeStatus, onConfirmPayment }) => {
  const { student, guardian } = registration;
  
  const handleArchive = () => {
    if(window.confirm(`Tem certeza que deseja marcar ${student.fullName} como inativo?`)) {
        onChangeStatus(student.id, 'inactive');
    }
  }

  const handleReactivate = () => {
     if(window.confirm(`Tem certeza que deseja reativar ${student.fullName}?`)) {
        onChangeStatus(student.id, 'active');
    }
  }
  
  const getStatusBadge = () => {
    switch (student.status) {
        case 'inactive':
            return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">Inativo</span>;
        default:
            return null;
    }
  }

  const getCardBorderClass = () => {
    if (!lastPayment) return '';
    if (lastPayment.status === 'overdue') return 'ring-2 ring-red-500';
    if (lastPayment.status === 'pending' && new Date(lastPayment.dueDate) < new Date()) return 'ring-2 ring-yellow-400';
    return '';
  }

  const renderPaymentStatus = () => {
    if (!lastPayment) return <span className="text-sm text-gray-400 italic">Sem registros</span>;

    const formatDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const statusConfig = {
        paid: { icon: CheckCircleIcon, text: 'Pago', className: 'bg-green-100 text-green-800' },
        pending: { icon: ClockIcon, text: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
        overdue: { icon: ExclamationCircleIcon, text: 'Vencido', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[lastPayment.status];
    const Icon = config.icon;

    return (
        <div className="flex flex-col mt-1">
             <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${config.className}`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.text}
                    </span>
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        Venc. {formatDate(lastPayment.dueDate)}
                    </span>
                </div>
                {lastPayment.status !== 'paid' && (
                    <button
                        onClick={(e) => {
                             e.stopPropagation();
                             if(window.confirm(`Confirmar pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lastPayment.amount)}?`)) {
                                 onConfirmPayment(lastPayment.id);
                             }
                        }}
                        className="ml-2 text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors shadow-sm flex items-center whitespace-nowrap"
                        title="Confirmar Pagamento"
                    >
                        <BanknotesIcon className="w-3 h-3 mr-1" />
                        Pagar
                    </button>
                )}
             </div>
        </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg flex flex-col overflow-hidden transition-all transform hover:-translate-y-1 hover:shadow-2xl duration-300 ${getCardBorderClass()}`}>
      <div className="p-6 flex-grow">
        <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <img 
                className="h-20 w-20 rounded-full object-cover border-4 border-blue-200"
                src={student.photoUrl} 
                alt={student.fullName} 
              />
              <div>
                <h3 className="text-xl font-bold text-gray-800">{student.fullName}</h3>
                <p className="text-sm text-gray-500">{student.schoolGrade}</p>
                <div className="mt-2 flex items-center space-x-2">
                    {getStatusBadge()}
                </div>
              </div>
            </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start">
            <BookOpenIcon className="h-5 w-5 text-blue-700 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-600">Matérias:</span>
              <p className="text-gray-500">{student.subjectsOfInterest.join(', ')}</p>
            </div>
          </div>
           <div className="flex items-start">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-700 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-600">Mensalidade:</span>
              <p className="text-gray-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(student.monthlyFee)}</p>
            </div>
          </div>
          <div className="flex items-start">
            <BanknotesIcon className="h-5 w-5 text-blue-700 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-gray-600">Status Financeiro:</span>
              {renderPaymentStatus()}
            </div>
          </div>
          <div className="flex items-start">
            <ShieldCheckIcon className="h-5 w-5 text-blue-700 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-600">Responsável:</span>
              <p className="text-gray-500">{guardian.fullName} ({guardian.relationship})</p>
            </div>
          </div>
          <div className="flex items-start">
            <PhoneIcon className="h-5 w-5 text-blue-700 mr-3 flex-shrink-0 mt-0.5" />
             <div>
              <span className="font-semibold text-gray-600">Contato:</span>
              <p className="text-gray-500">{guardian.phone}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 p-3 border-t border-gray-200 flex items-center justify-end space-x-2">
         <button onClick={() => onEdit(registration)} className="flex items-center space-x-2 text-sm text-gray-600 font-medium px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
            <PencilIcon className="h-4 w-4" />
            <span>Editar</span>
         </button>
         {student.status === 'active' ? (
              <button onClick={handleArchive} className="flex items-center space-x-2 text-sm text-red-600 font-medium px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors">
                  <ArchiveBoxIcon className="h-4 w-4" /> 
                  <span>Arquivar</span>
              </button>
          ) : (
              <button onClick={handleReactivate} className="flex items-center space-x-2 text-sm text-green-600 font-medium px-3 py-1.5 rounded-md hover:bg-green-100 transition-colors">
                  <ArrowUturnLeftIcon className="h-4 w-4" /> 
                  <span>Reativar</span>
              </button>
          )}
      </div>
    </div>
  );
};

export default StudentCard;
