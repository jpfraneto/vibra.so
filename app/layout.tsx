'use client'
import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import BottomNav from '../components/BottomNav';
import MainComponent from '../components/MainComponent'
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider
          appId="cly7pecis0267vpbugrpyvis6"
          config={{
            loginMethods: ['farcaster'],
            externalWallets: { 
              coinbaseWallet: { 
                connectionOptions: 'smartWalletOnly', 
              }, 
            }, 
            appearance: {
              theme: 'light',
              accentColor: '#00FFFFF',
              logo: '',
            },
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
          }}
        >
          <MainComponent children={children}/>
        </PrivyProvider>
      </body>
    </html>
  );
}