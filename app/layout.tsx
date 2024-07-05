'use client'
import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import BottomNav from '../components/BottomNav';
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
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-full max-w-[375px] h-[812px] bg-white overflow-hidden relative shadow-lg rounded-lg">
              <main className="h-full overflow-y-auto pb-16">
                {children}
              </main>
            </div>
          </div>
        </PrivyProvider>
      </body>
    </html>
  );
}