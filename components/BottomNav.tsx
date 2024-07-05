// components/BottomNav.tsx
import React from 'react';
import { Home, User, Video, Wallet, MessageCircle } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

const BottomNav = ({ onRecordClick, isRecording, stopRecording }) => {
  const { login, authenticated } = usePrivy();

  const handleNavClick = (route: string) => {
    if (route === 'record') {
      if (!authenticated) {
        login();
      } else {
        onRecordClick();
      }
    } else {
      alert(`Open ${route} route`);
    }
  };

  return (
    <nav className="bottom-0 left-0 right-0 bg-black text-white">
      <div className="flex justify-around items-center h-16 max-w-[375px] mx-auto">
        <NavItem icon={<Home size={24} />} label="Home" onClick={() => handleNavClick('home')} />
        <NavItem icon={<User size={24} />} label="Profile" onClick={() => handleNavClick('profile')} />
        <RecordButton 
          isRecording={isRecording} 
          onClick={() => handleNavClick('record')}
          stopRecording={stopRecording}
        />
        <NavItem icon={<Wallet size={24} />} label="Wallet" onClick={() => handleNavClick('wallet')} />
        <NavItem icon={<MessageCircle size={24} />} label="Messages" onClick={() => handleNavClick('messages')} />
      </div>
    </nav>
  );
};

const NavItem = ({ icon, label, onClick }) => (
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

const RecordButton = ({ isRecording, onClick, stopRecording }) => (
  <button 
    className={`flex flex-col items-center justify-center -mt-2 w-24 h-24 rounded-full ${
      isRecording ? 'bg-red-600' : 'bg-blue-500'
    } hover:bg-[#FF0000] transition-colors duration-200`}
    onClick={isRecording ? stopRecording : onClick}
  >
    <Video size={32} className="text-white" />
    <span className="text-xs text-white mt-1">{isRecording ? 'Stop' : 'Record'}</span>
  </button>
);

export default BottomNav;