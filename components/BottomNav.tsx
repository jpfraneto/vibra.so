import React from 'react';
import { Home, User, Wallet, MessageCircle, Vibrate, StopCircle, Download, Repeat } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';


interface BottomNavProps {
  onRecordClick: () => void;
  isVibrating: boolean;
  stopRecording: () => void;
  isRecording: boolean;
  hasRecordedVideo: boolean;
  onDownloadClick: () => void;
  onResetClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({
  onRecordClick,
  isVibrating,
  stopRecording,
  isRecording,
  hasRecordedVideo,
  onDownloadClick,
  onResetClick
}) => {
  const { login, authenticated, user } = usePrivy();

  const handleNavClick = (route: string) => {
    if (route === 'wallet') {
      if (user?.wallet) {
        const userWalletAddress = user.wallet.address;
        navigator.clipboard.writeText(userWalletAddress || "");
        alert(`Your wallet address was copied ${userWalletAddress}`);
      }
    } else if (route === 'home') {
      alert("Home clicked");
    } else if (route === 'profile') {
      alert("Who are you?");
    } else if (route === 'messages') {
      alert("Messages clicked");
    }
  };

  return (
    <motion.nav 
      className="rounded-full"
      animate={{
        backgroundColor: isRecording ? 'rgba(0, 0, 0, 0.5)' : 'black',
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around items-center h-14 w-full mx-auto">
        <NavItem icon={<Home size={24} />} label="Home" onClick={() => handleNavClick('home')} />
        <NavItem icon={<User size={24} />} label="Profile" onClick={() => handleNavClick('profile')} />
        <RecordButton 
          isVibrating={isVibrating}
          isRecording={isRecording}
          hasRecordedVideo={hasRecordedVideo}
          onClick={isRecording ? stopRecording : (hasRecordedVideo ? onDownloadClick : onRecordClick)}
          onResetClick={onResetClick}
        />
        <NavItem icon={<Wallet size={24} />} label="Wallet" onClick={() => handleNavClick('wallet')} />
        <NavItem icon={<MessageCircle size={24} />} label="Messages" onClick={() => handleNavClick('messages')} />
      </div>
    </motion.nav>
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
  </span>
);

interface RecordButtonProps {
  isVibrating: boolean;
  isRecording: boolean;
  hasRecordedVideo: boolean;
  onClick: () => void;
  onResetClick: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({ isVibrating, isRecording, hasRecordedVideo, onClick, onResetClick }) => {
  let buttonClass = "flex flex-col items-center justify-center w-16 h-16 rounded-full ";
  let Icon;

  if (isVibrating) {
    buttonClass += "bg-purple-600 animate-pulse";
    Icon = Vibrate;
  } else if (isRecording) {
    buttonClass += "bg-red-600 animate-pulse";
    Icon = StopCircle;
  } else if (hasRecordedVideo) {
    buttonClass += "bg-blue-500";
    Icon = Download;
  } else {
    buttonClass += "bg-blue-500 hover:bg-[#FF0000]";
    Icon = Vibrate;
  }

  buttonClass += " transition-colors duration-200";

  return (
    <div className="relative">
      <button 
        className={buttonClass}
        onClick={onClick}
      >
        <Icon size={32} color="white" />
      </button>
      {hasRecordedVideo && (
        <button
          className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
          onClick={onResetClick}
        >
          <Repeat size={16} color="white" />
        </button>
      )}
    </div>
  );
};

export default BottomNav;