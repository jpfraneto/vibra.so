import React from 'react';
import { Home, User, Wallet, MessageCircle, Vibrate } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

interface BottomNavProps {
  onRecordClick: () => void;
  isVibrating: boolean;
  stopRecording: () => void;
  onVibrateClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onRecordClick, isVibrating, stopRecording, onVibrateClick }) => {
  const { login, authenticated, user } = usePrivy();

  const handleNavClick = (route: string) => {
    if (route === 'wallet') {
      if (user?.wallet) {
        const userWalletAddress = user.wallet.address;
        navigator.clipboard.writeText(userWalletAddress || "");
        alert(`Your wallet address was copied ${userWalletAddress}`);
      }
    } else if (route === 'vibrate') {
      onVibrateClick();
    }
  };

  return (
    <nav className="bottom-0 z-3 w-full left-0 right-0 bg-black text-white">
      <div className="flex justify-around items-center h-16 w-full mx-auto">
        <NavItem icon={<Home size={24} />} label="Home" onClick={() => handleNavClick('home')} />
        <NavItem icon={<User size={24} />} label="Profile" onClick={() => handleNavClick('profile')} />
        <RecordButton 
          isVibrating={isVibrating} 
          onClick={() => handleNavClick('vibrate')}
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
  isVibrating: boolean;
  onClick: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ isVibrating, onClick }) => (
  <button 
    className={`flex flex-col items-center justify-center -mt-6 w-16 h-16 rounded-full ${
      isVibrating ? 'bg-purple-600' : 'bg-blue-500'
    } hover:bg-[#FF0000] transition-colors duration-200`}
    onClick={onClick}
  >
    <Vibrate size={32}/>
  </button>
);

export default BottomNav;