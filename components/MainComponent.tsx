// components/MainComponent.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import BottomNav from './BottomNav';
import VibrationEffect from './VibrationEffect';

const MainComponent = ({ children }: { children: React.ReactNode }) => {
  const { authenticated, logout, login } = usePrivy();
  const [isVibrating, setIsVibrating] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleVibrateClick = useCallback(() => {
    setIsVibrating(true);
    setIntensity(prev => Math.min(prev + 1, 5));

    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      setIsVibrating(false);
      setIntensity(1);
    }, 3000);

    setTimer(newTimer);
  }, [timer]);

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return (
    <div className="h-screen bg-black flex items-center justify-center">
      <VibrationEffect isVibrating={isVibrating} intensity={intensity}>
        <div className="w-full flex-grow flex max-w-[375px] h-screen max-h-[812px] bg-white overflow-hidden relative shadow-lg rounded-lg">
          <main className="grow overflow-y-auto relative">
            {children}
          </main>
          <div className='w-full absolute bottom-0'>
            <BottomNav
              onRecordClick={() => {}}
              isVibrating={isVibrating}
              stopRecording={() => {}}
              onVibrateClick={handleVibrateClick}
            />
          </div>
        </div>
      </VibrationEffect>
    </div>
  );
};

export default MainComponent;