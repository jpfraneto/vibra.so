// components/BottomNav.tsx
import React from 'react';
import { Home, User, Video, Wallet, MessageCircle } from 'lucide-react';

interface BottomNavProps {
  onRecordClick: () => void;
  isRecording: boolean;
  stopRecording: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onRecordClick, isRecording, stopRecording }) => {
  const handleNavClick = (route: string) => {
    if (route === 'record') {
      if (isRecording) {
        stopRecording();
      } else {
        onRecordClick();
      }
    } else {
      alert(`Open ${route} route`);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black text-white">
      <div className="flex justify-around items-center h-16 max-w-[375px] mx-auto">
        <NavItem icon={<Home size={24} />} label="Home" onClick={() => handleNavClick('home')} />
        <NavItem icon={<User size={24} />} label="Profile" onClick={() => handleNavClick('profile')} />
        <RecordButton 
          isRecording={isRecording} 
          onClick={() => handleNavClick('record')}
        />
        <NavItem icon={<Wallet size={24} />} label="Wallet" onClick={() => handleNavClick('wallet')} />
        <NavItem icon={<MessageCircle size={24} />} label="Messages" onClick={() => handleNavClick('messages')} />
      </div>
    </nav>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, onClick }) => (
  <button 
    className="flex flex-col items-center group"
    onClick={onClick}
  >
    <div className="group-hover:text-[#FF0000] transition-colors duration-200">
      {icon}
    </div>
    <span className="text-xs group-hover:text-[#FF0000] transition-colors duration-200">{label}</span>
  </button>
);

interface RecordButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onClick }) => (
  <button 
    className={`flex flex-col items-center justify-center -mt-6 w-16 h-16 rounded-full ${
      isRecording ? 'bg-red-600' : 'bg-blue-500'
    } hover:bg-[#FF0000] transition-colors duration-200`}
    onClick={onClick}
  >
    <Video size={32} className="text-white" />
    <span className="text-xs text-white mt-1">{isRecording ? 'Stop' : 'Record'}</span>
  </button>
);

export default BottomNav;