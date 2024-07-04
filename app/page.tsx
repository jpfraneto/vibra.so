'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

const story = `En el corazón del reino digital, surge una nueva avenida de expresión: Zurf, un cliente de Farcaster que está a punto de cambiarlo todo. Mientras tu video comienza su viaje a través de la blockchain, permíteme llevarte en un recorrido por el futuro de la interacción social.

Imagina un mundo donde cada voz importa, donde las ideas fluyen libremente a través de fronteras y barreras. Esa es la promesa de Web3, y Zurf está aquí para hacerla realidad. Tu video no es solo datos; es una parte de ti, un momento en el tiempo, capturado y compartido con el mundo.

Mientras hablamos, tu creación se está entretejiendo en el tejido de la blockchain. Cada byte es un hilo en este tapiz de expresión humana. ¿Puedes sentir la emoción? Esto es más que una simple carga; es una revolución en la forma en que nos conectamos, compartimos y crecemos.

En este nuevo mundo, tu contenido no es propiedad de corporaciones sin rostro. Es tuyo, verdadera y eternamente. La blockchain asegura que tu voz nunca pueda ser silenciada, tu creatividad nunca sofocada. Con cada segundo que pasa, tu video se acerca más a convertirse en una parte permanente de esta red descentralizada.

Pero Zurf es más que solo una plataforma; es una comunidad. Mientras tu video se carga, imagina a los innumerables otros que lo verán, se conmoverán con él, responderán a él. En este ecosistema de ideas, cada interacción genera nuevos pensamientos, nuevas creaciones. Es un hermoso ciclo de inspiración e innovación.

El poder de la tecnología blockchain va más allá de simplemente asegurar tu contenido. Se trata de crear un mundo más justo y transparente. Un mundo donde los artistas son justamente compensados, donde las ideas se rastrean hasta su origen, donde la confianza está integrada en el mismo sistema que usamos para comunicarnos.

A medida que nos acercamos al final de este viaje de carga, tómate un momento para apreciar la magnitud de lo que está sucediendo. Tu video, tu momento, está a punto de convertirse en parte de algo más grande que todos nosotros. Es un paso hacia un futuro donde la tecnología empodera en lugar de explotar, donde las comunidades prosperan en la autenticidad y las experiencias compartidas.

Esta es la belleza de la experiencia humana en la era digital: la capacidad de tocar vidas en todo el globo con el clic de un botón. Tu voz, amplificada por la blockchain, tiene el poder de inspirar, de enseñar, de cambiar el mundo.

Y ahora, mientras tu video encuentra su hogar en esta nueva frontera digital, recuerda: esto es solo el comienzo. Bienvenido a Zurf, bienvenido al futuro de la interacción social. Tu viaje en este nuevo mundo comienza ahora.`;

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [castHash, setCastHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [storyIndex, setStoryIndex] = useState(0)
  const [showUploadInterface, setShowUploadInterface] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("El archivo es demasiado grande. El tamaño máximo es de 50 MB.");
        setFile(null);
      } else {
        setFile(selectedFile);
        setError(null);
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
    setUploadProgress(0)

    // Simulate upload progress
    const intervalId = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalId)
          return 100
        }
        return prev + (100 / 60)
      })
    }, 1000)

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
      clearInterval(intervalId)
    }
  }

  const streamStory = useCallback(() => {
    if (storyIndex < story.length && uploading) {
      setStoryIndex(prevIndex => prevIndex + 1);
      setTimeout(streamStory, 33); // Adjust speed here
    }
  }, [storyIndex, uploading]);

  useEffect(() => {
    if (uploading) {
      streamStory();
    }
  }, [uploading, streamStory]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-left p-2 sm:p-6 md:p-24 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000">
      <AnimatePresence>
        {showUploadInterface && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl items-center justify-between font-mono text-sm bg-white p-6 rounded-xl shadow-2xl"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center">Subir Video (MAX 50 MB)</h1>
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
                {uploading ? 'subiendo...' : 'subir video'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {uploading && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mb-8"
          >
            <h2 className="text-white text-center mb-2">subiendo tu video al éter</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <motion.div 
                className="bg-blue-600 h-2.5 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-lg sm:text-xl md:text-2xl font-bold text-white text-center max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
          >
            {story.slice(0, storyIndex)}
          </motion.div>
        </>
      )}

      {uploadResult && castHash && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mt-8"
        >
          <a 
            href={`https://www.warpcast.com/!738435/${castHash.slice(0,10)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-white text-lg sm:text-xl md:text-2xl font-bold p-3 sm:p-4 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 hover:from-pink-500 hover:to-yellow-500 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
          >
            Ver en Warpcast
          </a>
        </motion.div>
      )}
    </main>
  )
}