// app/messages/page.tsx
'use client'

import React from 'react';
import BottomNav from '../../components/BottomNav';
import { usePrivy } from '@privy-io/react-auth';

export default function WalletPage() {
  const { user } = usePrivy()
  console.log("The user is: ", user)
  return (
    <div className="h-full flex text-black flex-col">
      <div className="flex-grow flex flex-col items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">your wallet is</p>
        <p className='text-sm text-center'>{user?.wallet?.address}</p>

      </div>
    </div>
  );
}