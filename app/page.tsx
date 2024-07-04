'use client'

import { useState, useEffect } from 'react'

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [castHash, setCastHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
              setUploadResult(parsed.videoRecord)
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Video Upload (MAX 50 MB. DONT BREAK IT PLZ)</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="file" 
            accept="video/*" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100
            "
          />
          {error && <p className="text-red-500">{error}</p>}
          <button 
            type="submit" 
            disabled={!file || uploading || !!error} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
        {progress.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-bold">Progress:</h2>
            <ul className="list-disc pl-5">
              {progress.map((msg, index) => (
                <li key={index} className="mt-1">{msg}</li>
              ))}
            </ul>
          </div>
        )}
        {uploadResult && (
          <div className="mt-8">
            {castHash && (
              <div className="mt-4">
                <h3 className="text-xl font-bold mb-2 text-white p-2 rounded-xl bg-purple-500">warpcast Link:</h3>
                <a href={`https://www.warpcast.com/~/channel/738435/${castHash.slice(0,10)}`} target="_blank" rel="noopener noreferrer" className="">
                  View on Warpcast
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}