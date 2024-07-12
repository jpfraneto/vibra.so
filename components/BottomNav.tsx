// components/BottomNav.tsx
"use client"
import React from 'react';
import { Home, User, Video, Wallet, MessageCircle, StopCircle } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

interface BottomNavProps {
  onRecordClick: () => void;
  isRecording: boolean;
  stopRecording: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onRecordClick, isRecording, stopRecording }) => {
  const { login, authenticated, user } = usePrivy() 
  const handleNavClick = (route: string) => {
    if (route === 'record') {
      if(authenticated) {
        if (isRecording) {
          stopRecording();
        } else {
          onRecordClick();
        }
      } else {
        login()
      }
    } else if (route === 'wallet'){
      console.log("the user is: ", user)
      if(user?.wallet!){
        const userWalletAddress = user?.wallet?.address
        navigator.clipboard.writeText(userWalletAddress || "")
        alert(`your wallet address was copied ${userWalletAddress}`)
      }
    }
  };

  return (
    <nav className="z-3 w-full bottom-0 left-0 right-0 bg-black text-white">
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
  <span 
    className="flex flex-col items-center group hover:cursor-pointer"
    onClick={onClick}
  >
    <div className="group-hover:text-[#FF0000] transition-colors duration-200">
      {icon}
    </div>
    <span className="text-xs group-hover:text-[#FF0000] transition-colors duration-200">{label}</span>
  </span>
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
    {isRecording ? <StopCircle size={32} className="text-white" /> : <Video size={32} className="text-white" />}
  </button>
);

export default BottomNav;