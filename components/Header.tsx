import React from 'react';
import { PlusCircleIcon, UsersIcon, BanknotesIcon, HomeIcon } from './icons';

type View = 'dashboard' | 'students' | 'form' | 'financial';

interface HeaderProps {
  onAddNew: () => void;
  currentView: View;
  setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddNew, currentView, setView }) => {
  const navButtonStyle = "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeNavButtonStyle = "bg-blue-100 text-blue-700";
  const inactiveNavButtonStyle = "text-gray-600 hover:bg-gray-200";

  return (
    <header className="bg-white shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => setView('dashboard')} className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
             <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                S
             </div>
             <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                SysAlunos
             </h1>
          </button>
          <nav className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
             <button
              onClick={() => setView('dashboard')}
              className={`${navButtonStyle} ${currentView === 'dashboard' ? activeNavButtonStyle : inactiveNavButtonStyle}`}
            >
              <HomeIcon className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
             <button
              onClick={() => setView('students')}
              className={`${navButtonStyle} ${currentView === 'students' || currentView === 'form' ? activeNavButtonStyle : inactiveNavButtonStyle}`}
            >
              <UsersIcon className="h-5 w-5" />
              <span>Alunos</span>
            </button>
            <button
              onClick={() => setView('financial')}
              className={`${navButtonStyle} ${currentView === 'financial' ? activeNavButtonStyle : inactiveNavButtonStyle}`}
            >
              <BanknotesIcon className="h-5 w-5" />
              <span>Financeiro</span>
            </button>
          </nav>
        </div>
        
        <button
          onClick={onAddNew}
          className="flex items-center space-x-2 bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform transform hover:scale-105"
        >
          <PlusCircleIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Novo Aluno</span>
        </button>
      </div>
    </header>
  );
};

export default Header;