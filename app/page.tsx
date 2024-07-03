'use client'

import { useState } from 'react'
import axios from 'axios'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
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
    const formData = new FormData()
    formData.append('video', file)

    try {
      const response = await axios.post('/api/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setUploadResult(response.data)
    } catch (error) {
      console.error('Error uploading video:', error)
      setUploadResult({ error: 'Failed to upload video' })
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
        {uploadResult && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Upload Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{JSON.stringify(uploadResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </main>
  )
}