'use client'

import { useState } from 'react'

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [castHash, setCastHash] = useState<any>(null)
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
    setProgress('')
    setUploadResult(null)

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

      const result = await response.json();
      console.log("Upload result:", result);
      setUploadResult(result.videoRecord);
      setCastHash(result.castHash)
      setProgress('Upload complete!');
    } catch (error) {
      console.error('Error uploading video:', error)
      setProgress('Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Video Upload</h1>
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
        {progress && (
          <div className="mt-4">
            <h2 className="text-xl font-bold">Progress:</h2>
            <p>{progress}</p>
          </div>
        )}
        {uploadResult && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Upload Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{JSON.stringify(uploadResult, null, 2)}</pre>
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-2">IPFS Link:</h3>
              <a href={`https://www.warpcast.com/!738435/${castHash.slice(0,10)}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View on warpcast
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}