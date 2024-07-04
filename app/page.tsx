'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

const story = `In the heart of the digital realm, a new avenue of expression emerges - Zurf, a Farcaster client that's about to change everything. As your video begins its journey through the blockchain, let me take you on a ride through the future of social interaction.

Imagine a world where every voice matters, where ideas flow freely across borders and barriers. That's the promise of Web3, and Zurf is here to make it a reality. Your video isn't just data; it's a piece of you, a moment in time, captured and shared with the world.

As we speak, your creation is being woven into the fabric of the blockchain. Each byte is a thread in this tapestry of human expression. Can you feel the excitement? This is more than just an upload - it's a revolution in how we connect, how we share, how we grow.

In this new world, your content isn't owned by faceless corporations. It's yours, truly and forever. The blockchain ensures that your voice can never be silenced, your creativity never stifled. With each passing second, your video moves closer to becoming a permanent part of this decentralized network.

But Zurf is more than just a platform - it's a community. As your video uploads, imagine the countless others who will see it, be moved by it, respond to it. In this ecosystem of ideas, every interaction sparks new thoughts, new creations. It's a beautiful cycle of inspiration and innovation.

The power of blockchain technology goes beyond just securing your content. It's about creating a fairer, more transparent world. A world where artists are fairly compensated, where ideas are traced to their source, where trust is built into the very system we use to communicate.

As we near the end of this upload journey, take a moment to appreciate the magnitude of what's happening. Your video, your moment, is about to become a part of something bigger than all of us. It's a step towards a future where technology empowers rather than exploits, where communities thrive on authenticity and shared experiences.

This is the beauty of the human experience in the digital age - the ability to touch lives across the globe with the click of a button. Your voice, amplified by the blockchain, has the power to inspire, to teach, to change the world.

And now, as your video finds its home in this new digital frontier, remember: this is just the beginning. Welcome to Zurf, welcome to the future of social interaction. Your journey in this new world starts now.`;

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [castHash, setCastHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [storyIndex, setStoryIndex] = useState(0)
  const [showUploadInterface, setShowUploadInterface] = useState(true)

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
    setShowUploadInterface(false)

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

  const streamStory = useCallback(() => {
    if (storyIndex < story.length && uploading) {
      setStoryIndex(prevIndex => prevIndex + 1);
      setTimeout(streamStory, 50); // Adjust speed here
    }
  }, [storyIndex, uploading]);

  useEffect(() => {
    if (uploading) {
      streamStory();
    }
  }, [uploading, streamStory]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-24 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000">
      <AnimatePresence>
        {showUploadInterface && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl items-center justify-between font-mono text-sm bg-white p-6 rounded-xl shadow-2xl"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center">Video Upload (MAX 50 MB)</h1>
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
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button 
                type="submit" 
                disabled={!file || uploading || !!error} 
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors duration-300"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
        >
          {story.slice(0, storyIndex)}
        </motion.div>
      )}

      {progress.length > 0 && (
        <div className="mt-4 text-white">
          <h2 className="text-lg sm:text-xl font-bold">Progress:</h2>
          <ul className="list-disc pl-5">
            {progress.map((msg, index) => (
              <li key={index} className="mt-1 text-sm sm:text-base">{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {uploadResult && castHash && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mt-8"
        >
          <a 
            href={`https://www.warpcast.com/~/channel/738435/${castHash.slice(0,10)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white text-lg sm:text-xl md:text-2xl font-bold p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 hover:from-pink-500 hover:to-yellow-500 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
          >
            view on Warpcast
          </a>
        </motion.div>
      )}
    </main>
  )
}