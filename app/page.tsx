'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [uploadResult, setUploadResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setProgress('')
    setUploadResult(null)

    const formData = new FormData()
    formData.append('video', file)

    try {
      const response = await fetch('https://api.anky.bot/video', {
        method: 'POST',
        body: formData,
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to get response reader')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.message) {
              setProgress(data.message)
            } else if (data.videoRecord) {
              setUploadResult(data.videoRecord)
            }
          }
        }
      }
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
          <input type="file" accept="video/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
          "/>
          <button type="submit" disabled={!file || uploading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
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
              <h3 className="text-xl font-bold mb-2">Generated GIF:</h3>
              <img src={uploadResult.gifPath} alt="Generated GIF" className="max-w-full h-auto" />
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-2">IPFS Link:</h3>
              <a href={`https://ipfs.io/ipfs/${uploadResult.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View on IPFS
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}