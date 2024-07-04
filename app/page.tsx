'use client'

import { useState, useEffect } from 'react'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { Upload, Camera } from 'lucide-react'

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [castHash, setCastHash] = useState<string | null>(null)
  const [gifLink, setGifLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { login, authenticated, user, logout } = usePrivy()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("File is too large. Maximum size is 50 MB.");
        setFile(null);
      } else {
        setFile(selectedFile);
        setError(null);
        console.log("Selected file:", selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setProgress([])
    setUploadResult(null)
    setCastHash(null)

    const formData = new FormData()
    formData.append('video', file)
    if (user) {
      if (user.farcaster) {
        formData.append('farcasterUser', JSON.stringify(user.farcaster))
      }
      formData.append('userId', user.id)
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE}/video`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const decodedChunk = decoder.decode(value, { stream: true })
        const lines = decodedChunk.split('\n').filter(line => line.trim() !== '')
        lines.forEach(line => {
          try {
            const parsed = JSON.parse(line)
            if (parsed.type === 'progress') {
              setProgress(prev => [...prev, parsed.message])
            } else if (parsed.type === 'result') {
              console.log("The parsed is: ", parsed)
              setGifLink(parsed.gifLink)
              setCastHash(parsed.castHash)
            }
          } catch (e) {
            console.error('Error parsing server message:', e)
          }
        })
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      setProgress(prev => [...prev, 'Failed to upload video'])
      setError('Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-2">
          <h1 className="text-2xl font-bold mb-4 text-black text-center">guarpcast</h1>
          {!authenticated ? (
            <button
              onClick={login}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300"
            >
              connect farcaster
            </button>
          ) : (
            <div className='text-black text-center'>
              <p className='mb-4'>connected as @{user?.farcaster?.username}</p>
              <button
                onClick={logout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
              >
                logout
              </button>
                        
            </div>
          )}
        </div>
        
      
        {gifLink && castHash ? (
          <div className="mt-4 flex flex-col w-full p-4 border-t border-gray-200">
            <div className="mb-4">
                <img 
                  src={gifLink} 
                  alt="Uploaded GIF" 
                  className="w-full rounded-md"
                />
              </div>
            <a 
              href={`https://www.warpcast.com/!738435/${castHash.slice(0,10)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block w-full text-center bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 transition duration-300"
            >
              View on Warpcast
            </a>
          </div>
        ) : <div>
                  <form onSubmit={handleSubmit} className=" p-4">
          <div className={`${file && 'hidden'} relative`}>
            <input 
              type="file" 
              accept="video/*" 
              onChange={handleFileChange} 
              className="hidden"
              id="fileInput"
            />
            <label 
              htmlFor="fileInput"
              className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-black transition duration-300"
            >
              {file ? file.name : 'choose a video'}
            </label>
          </div>
          {file && (
            <button 
            type="submit" 
            disabled={!file || uploading || !!error} 
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition duration-300"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          )}
          {file && (
            <video className="w-full mt-4 rounded-md" controls>
              <source src={URL.createObjectURL(file)} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}


        </form>
        {progress.length > 0 && (
          <div className="mt-4 p-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-2">Progress:</h2>
            <ul className="list-disc pl-5 text-sm">
              {progress.map((msg, index) => (
                <li key={index} className="mt-1">{msg}</li>
              ))}
            </ul>
          </div>
        )}</div>}
      </div>
      <label 
        htmlFor="fileInput"
        className="fixed bottom-4 right-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition duration-300"
      >
        <Camera className="text-white" size={24} />
      </label>
    </div>
  )
}

export default function Home() {
  return (
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
        <div className="w-full max-w-md h-[812px] bg-white overflow-y-auto">
          <App />
        </div>
      </div>
    </PrivyProvider>
  )
}