
import React, { useState, FormEvent, useEffect } from 'react';
import type { Registration, Student, Guardian } from '../types';
import { SCHOOL_SUBJECTS } from '../constants';
import { generateStudyPlan } from '../services/geminiService';
import { UserIcon, ShieldCheckIcon, SparklesIcon, XMarkIcon } from './icons';

interface RegistrationFormProps {
  initialData?: Registration | null;
  onSave: (registration: Registration) => void;
  onCancel: () => void;
  onSuccess: () => void;
}

const initialStudentState: Omit<Student, 'id' | 'photoUrl' | 'status' | 'createdAt'> = {
  fullName: '',
  birthDate: '',
  schoolGrade: '',
  subjectsOfInterest: [],
  learningDifficulties: '',
  monthlyFee: 0,
  paymentDueDay: 10, // Default due day
};

const initialGuardianState: Guardian = {
  fullName: '',
  relationship: '',
  phone: '',
  email: '',
  address: '',
  cpf: ''
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({ initialData, onSave, onCancel, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'guardian'>('student');
  const [student, setStudent] = useState(initialStudentState);
  const [guardian, setGuardian] = useState(initialGuardianState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setStudent({
        fullName: initialData.student.fullName,
        birthDate: initialData.student.birthDate,
        schoolGrade: initialData.student.schoolGrade,
        subjectsOfInterest: initialData.student.subjectsOfInterest,
        learningDifficulties: initialData.student.learningDifficulties,
        monthlyFee: initialData.student.monthlyFee || 0,
        paymentDueDay: initialData.student.paymentDueDay || 10,
      });
      setGuardian(initialData.guardian);
    } else {
      setStudent(initialStudentState);
      setGuardian(initialGuardianState);
    }
  }, [initialData, isEditing]);

  const handleSubjectChange = (subject: string) => {
    setStudent(prev => {
      const newSubjects = prev.subjectsOfInterest.includes(subject)
        ? prev.subjectsOfInterest.filter(s => s !== subject)
        : [...prev.subjectsOfInterest, subject];
      return { ...prev, subjectsOfInterest: newSubjects };
    });
    if (errors.studentSubjects) {
      setErrors(prev => ({ ...prev, studentSubjects: '' }));
    }
  };
  
  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Student Validation
    if (!student.fullName.trim()) newErrors.studentFullName = "O nome completo é obrigatório.";
    if (!student.birthDate) {
        newErrors.studentBirthDate = "A data de nascimento é obrigatória.";
    } else if (new Date(student.birthDate) >= new Date()) {
        newErrors.studentBirthDate = "A data de nascimento deve ser no passado.";
    }
    if (!student.schoolGrade.trim()) newErrors.studentSchoolGrade = "O ano escolar é obrigatório.";
    if (!String(student.monthlyFee)) {
      newErrors.studentMonthlyFee = "O valor da mensalidade é obrigatório.";
    } else if (isNaN(Number(student.monthlyFee)) || Number(student.monthlyFee) <= 0) {
      newErrors.studentMonthlyFee = "Por favor, insira um valor numérico positivo.";
    }
    
    if (!String(student.paymentDueDay)) {
        newErrors.studentPaymentDueDay = "O dia do vencimento é obrigatório.";
    } else {
        const day = Number(student.paymentDueDay);
        if (isNaN(day) || day < 1 || day > 31) {
             newErrors.studentPaymentDueDay = "Insira um dia válido entre 1 e 31.";
        }
    }

    if (student.subjectsOfInterest.length === 0) newErrors.studentSubjects = "Selecione pelo menos uma matéria.";
    if (!student.learningDifficulties.trim()) newErrors.studentDifficulties = "A descrição das dificuldades é obrigatória.";

    // Guardian Validation
    if (!guardian.fullName.trim()) newErrors.guardianFullName = "O nome do responsável é obrigatório.";
    if (!guardian.cpf.trim()) {
        newErrors.guardianCpf = "O CPF é obrigatório.";
    } else if (guardian.cpf.replace(/\D/g, '').length !== 11) {
        newErrors.guardianCpf = "O CPF deve conter 11 dígitos.";
    }
    if (!guardian.relationship.trim()) newErrors.guardianRelationship = "O parentesco é obrigatório.";
    if (!guardian.phone.trim()) {
        newErrors.guardianPhone = "O telefone é obrigatório.";
    } else if (guardian.phone.replace(/\D/g, '').length < 8) {
        newErrors.guardianPhone = "O número de telefone parece inválido.";
    }
    if (!guardian.email.trim()) {
        newErrors.guardianEmail = "O e-mail é obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardian.email)) {
        newErrors.guardianEmail = "O formato do e-mail é inválido.";
    }
    if (!guardian.address.trim()) newErrors.guardianAddress = "O endereço é obrigatório.";

    return newErrors;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey.startsWith('student') && activeTab !== 'student') {
        setActiveTab('student');
      } else if (firstErrorKey.startsWith('guardian') && activeTab !== 'guardian') {
        setActiveTab('guardian');
      }
      return;
    }
    
    setIsLoading(true);

    const registrationData: Registration = {
      student: {
        ...(initialData?.student || {}), // Keep id, photoUrl, status etc. if editing
        ...student,
        monthlyFee: Number(student.monthlyFee),
        paymentDueDay: Number(student.paymentDueDay),
      } as Student,
      guardian,
    };
    onSave(registrationData);
    
    // Only generate study plan for new students
    if (!isEditing) {
      try {
        const plan = await generateStudyPlan(registrationData.student);
        setStudyPlan(plan);
        setShowModal(true);
      } catch (error) {
        console.error("Failed to generate study plan", error);
        setStudyPlan("Ocorreu um erro ao gerar o plano de estudos.");
        setShowModal(true); // Still show modal but with error message
      } finally {
        setIsLoading(false);
      }
    } else {
        setIsLoading(false);
        onSuccess();
    }
  };

  const closeModalAndFinish = () => {
    setShowModal(false);
    setStudyPlan(null);
    onSuccess();
  }

  const baseInputClasses = "mt-1 block w-full px-3 py-2 bg-white border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500";
  const errorInputClasses = "border-red-500";
  const normalInputClasses = "border-gray-300";
  
  const studentHasErrors = Object.keys(errors).some(key => key.startsWith('student'));
  const guardianHasErrors = Object.keys(errors).some(key => key.startsWith('guardian'));

  const renderStudentForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Nome Completo</label>
          <input type="text" id="studentName" value={student.fullName} onChange={e => setStudent({...student, fullName: e.target.value})} className={`${baseInputClasses} ${errors.studentFullName ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.studentFullName} aria-describedby="studentName-error"/>
          {errors.studentFullName && <p id="studentName-error" className="mt-1 text-sm text-red-600">{errors.studentFullName}</p>}
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
          <input type="date" id="birthDate" value={student.birthDate} onChange={e => setStudent({...student, birthDate: e.target.value})} className={`${baseInputClasses} ${errors.studentBirthDate ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.studentBirthDate} aria-describedby="birthDate-error"/>
          {errors.studentBirthDate && <p id="birthDate-error" className="mt-1 text-sm text-red-600">{errors.studentBirthDate}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-1">
          <label htmlFor="schoolGrade" className="block text-sm font-medium text-gray-700">Ano Escolar</label>
          <input type="text" id="schoolGrade" placeholder="Ex: 8º Ano" value={student.schoolGrade} onChange={e => setStudent({...student, schoolGrade: e.target.value})} className={`${baseInputClasses} ${errors.studentSchoolGrade ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.studentSchoolGrade} aria-describedby="schoolGrade-error"/>
          {errors.studentSchoolGrade && <p id="schoolGrade-error" className="mt-1 text-sm text-red-600">{errors.studentSchoolGrade}</p>}
        </div>
         <div>
          <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700">Valor da Mensalidade (R$)</label>
          <input type="number" id="monthlyFee" placeholder="Ex: 250" value={student.monthlyFee} onChange={e => setStudent({...student, monthlyFee: Number(e.target.value)})} className={`${baseInputClasses} ${errors.studentMonthlyFee ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.studentMonthlyFee} aria-describedby="monthlyFee-error"/>
          {errors.studentMonthlyFee && <p id="monthlyFee-error" className="mt-1 text-sm text-red-600">{errors.studentMonthlyFee}</p>}
        </div>
        <div>
          <label htmlFor="paymentDueDay" className="block text-sm font-medium text-gray-700">Dia do Vencimento</label>
          <input type="number" id="paymentDueDay" placeholder="Ex: 10" min="1" max="31" value={student.paymentDueDay} onChange={e => setStudent({...student, paymentDueDay: Number(e.target.value)})} className={`${baseInputClasses} ${errors.studentPaymentDueDay ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.studentPaymentDueDay} aria-describedby="paymentDueDay-error"/>
          {errors.studentPaymentDueDay && <p id="paymentDueDay-error" className="mt-1 text-sm text-red-600">{errors.studentPaymentDueDay}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Matérias de Interesse/Dificuldade</label>
        <div className={`mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 rounded-md border ${errors.studentSubjects ? 'border-red-500' : 'border-transparent'}`} aria-describedby="subjects-error">
          {SCHOOL_SUBJECTS.map(subject => (
            <label key={subject} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={student.subjectsOfInterest.includes(subject)} onChange={() => handleSubjectChange(subject)} className="h-4 w-4 text-blue-700 border-gray-300 rounded focus:ring-blue-500" />
              <span className="text-sm text-gray-600">{subject}</span>
            </label>
          ))}
        </div>
        {errors.studentSubjects && <p id="subjects-error" className="mt-1 text-sm text-red-600">{errors.studentSubjects}</p>}
      </div>
      <div>
        <label htmlFor="difficulties" className="block text-sm font-medium text-gray-700">Descreva as principais dificuldades</label>
        <textarea id="difficulties" rows={4} value={student.learningDifficulties} onChange={e => setStudent({...student, learningDifficulties: e.target.value})} className={`${baseInputClasses} ${errors.studentDifficulties ? errorInputClasses : normalInputClasses}`} placeholder="Ex: Dificuldade em interpretação de texto, resolver equações de segundo grau..." aria-invalid={!!errors.studentDifficulties} aria-describedby="difficulties-error"></textarea>
        {errors.studentDifficulties && <p id="difficulties-error" className="mt-1 text-sm text-red-600">{errors.studentDifficulties}</p>}
      </div>
    </div>
  );

  const renderGuardianForm = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700">Nome Completo do Responsável</label>
        <input type="text" id="guardianName" value={guardian.fullName} onChange={e => setGuardian({...guardian, fullName: e.target.value})} className={`${baseInputClasses} ${errors.guardianFullName ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.guardianFullName} aria-describedby="guardianName-error"/>
        {errors.guardianFullName && <p id="guardianName-error" className="mt-1 text-sm text-red-600">{errors.guardianFullName}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
          <label htmlFor="guardianCpf" className="block text-sm font-medium text-gray-700">CPF</label>
          <input type="text" id="guardianCpf" value={guardian.cpf} onChange={e => setGuardian({...guardian, cpf: e.target.value})} placeholder="000.000.000-00" className={`${baseInputClasses} ${errors.guardianCpf ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.guardianCpf} aria-describedby="guardianCpf-error"/>
          {errors.guardianCpf && <p id="guardianCpf-error" className="mt-1 text-sm text-red-600">{errors.guardianCpf}</p>}
        </div>
        <div>
          <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">Parentesco</label>
          <input type="text" id="relationship" value={guardian.relationship} onChange={e => setGuardian({...guardian, relationship: e.target.value})} placeholder="Ex: Mãe, Pai, Responsável Legal" className={`${baseInputClasses} ${errors.guardianRelationship ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.guardianRelationship} aria-describedby="relationship-error"/>
          {errors.guardianRelationship && <p id="relationship-error" className="mt-1 text-sm text-red-600">{errors.guardianRelationship}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone de Contato</label>
          <input type="tel" id="phone" value={guardian.phone} onChange={e => setGuardian({...guardian, phone: e.target.value})} className={`${baseInputClasses} ${errors.guardianPhone ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.guardianPhone} aria-describedby="phone-error"/>
          {errors.guardianPhone && <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.guardianPhone}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
          <input type="email" id="email" value={guardian.email} onChange={e => setGuardian({...guardian, email: e.target.value})} className={`${baseInputClasses} ${errors.guardianEmail ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.guardianEmail} aria-describedby="email-error"/>
          {errors.guardianEmail && <p id="email-error" className="mt-1 text-sm text-red-600">{errors.guardianEmail}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
        <input type="text" id="address" value={guardian.address} onChange={e => setGuardian({...guardian, address: e.target.value})} className={`${baseInputClasses} ${errors.guardianAddress ? errorInputClasses : normalInputClasses}`} aria-invalid={!!errors.guardianAddress} aria-describedby="address-error"/>
        {errors.guardianAddress && <p id="address-error" className="mt-1 text-sm text-red-600">{errors.guardianAddress}</p>}
      </div>
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-4xl mx-auto" noValidate>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditing ? 'Editar Cadastro do Aluno' : 'Novo Cadastro de Aluno'}</h2>
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button type="button" onClick={() => setActiveTab('student')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'student' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <UserIcon className="mr-2 h-5 w-5" /> 
              <span>Dados do Aluno</span>
              {studentHasErrors && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full" aria-label="Esta aba contém erros"></span>}
            </button>
            <button type="button" onClick={() => setActiveTab('guardian')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'guardian' ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              <ShieldCheckIcon className="mr-2 h-5 w-5" /> 
              <span>Dados do Responsável</span>
              {guardianHasErrors && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full" aria-label="Esta aba contém erros"></span>}
            </button>
          </nav>
        </div>

        {activeTab === 'student' ? renderStudentForm() : renderGuardianForm()}

        <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed">
            {isLoading ? (isEditing ? 'Salvando...' : 'Cadastrando...') : (isEditing ? 'Salvar Alterações' : 'Cadastrar Aluno')}
          </button>
        </div>
      </form>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full transform transition-all animate-scale-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-blue-500 mr-3" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">Cadastro Realizado com Sucesso!</h3>
              </div>
              <button onClick={closeModalAndFinish} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2">Sugestão de Plano de Estudos Inicial:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{studyPlan}</p>
            </div>
            <div className="mt-6 text-right">
              <button onClick={closeModalAndFinish} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Fechar
              </button>
            </div>
          </div>
          <style>{`
            @keyframes scale-in {
              0% { transform: scale(0.9); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
          `}</style>
        </div>
      )}
    </>
  );
};

export default RegistrationForm;
