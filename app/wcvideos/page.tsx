"use client"

import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [castHash, setCastHash] = useState('');
  const [gifUrl, setGifUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setGifUrl('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE}/wc-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ castHash }),
      });

      if (!response.ok) {
        throw new Error('Failed to process cast');
      }

      const data = await response.json();
      setGifUrl(data.gifUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <Head>
        <title>Process Farcaster Cast</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-semibold">Process Farcaster Cast</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <form onSubmit={handleSubmit} className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input
                    id="castHash"
                    name="castHash"
                    type="text"
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
                    placeholder="Enter Farcaster Cast Hash"
                    value={castHash}
                    onChange={(e) => setCastHash(e.target.value)}
                  />
                  <label htmlFor="castHash" className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                    Enter Farcaster Cast Hash
                  </label>
                </div>
                <div className="relative">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white rounded-md px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Process Cast'}
                  </button>
                </div>
              </form>
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {gifUrl && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Generated GIF:</h2>
                <img src={gifUrl} alt="Generated GIF" className="w-full rounded-lg shadow-md" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}