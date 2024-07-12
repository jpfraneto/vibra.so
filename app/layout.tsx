'use client'
import React, { useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import BottomNav from '../components/BottomNav';
import MainComponent from '../components/MainComponent'
import './globals.css';
import { Toaster } from 'react-hot-toast';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = '/registerSW.js'
      document.body.appendChild(script)
    }
  }, [])
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8B5CF6" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <PrivyProvider
          appId="cly7pecis0267vpbugrpyvis6"
          config={{
            loginMethods: ['farcaster'],
            // externalWallets: { 
            //   coinbaseWallet: { 
            //     connectionOptions: 'smartWalletOnly', 
            //   }, 
            // }, 
            appearance: {
              theme: 'light',
              accentColor: '#00FFFFF',
              logo: '',
              walletList: ['coinbase_wallet'], 
            },
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
          }}
        >
          <MainComponent>{children}</MainComponent>
          <Toaster /> 
        </PrivyProvider>
      </body>
    </html>
  );
}