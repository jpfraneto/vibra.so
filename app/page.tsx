// app/page.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import BottomNav from '../components/BottomNav';
import Image from 'next/image';
import ProgressBar from '../components/ProgressBar';
import { Lilita_One } from 'next/font/google'
import { motion } from 'framer-motion';

const lilitaOne = Lilita_One({ subsets: ['latin'], weight: '400', })

const MAX_RECORDING_TIME = 20; // seconds

export default function Home() {
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(100);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [castHash, setCastHash] = useState<string | null>(null);
  const [gifLink, setGifLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMediaAccess, setHasMediaAccess] = useState(false);
  const { authenticated, user, logout } = usePrivy();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Check for media access when the component mounts
    checkMediaAccess();
  }, []);

  const checkMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setHasMediaAccess(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach(track => track.stop()); // Stop the stream after checking
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasMediaAccess(false);
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    }
  };

  const subtitleVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        delay: 0.5
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      const chunks: Blob[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => chunks.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        setRecordedVideo(URL.createObjectURL(blob));
        handleUpload(blob); // Automatically upload when recording stops
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingProgress(100);

      // Start the timer for progress bar
      let timeLeft = MAX_RECORDING_TIME;
      timerRef.current = setInterval(() => {
        timeLeft -= 0.1;
        const progress = (timeLeft / MAX_RECORDING_TIME) * 100;
        setRecordingProgress(progress);
        if (timeLeft <= 0) {
          stopRecording();
        }
      }, 100);

      // Automatically stop recording after MAX_RECORDING_TIME
      setTimeout(stopRecording, MAX_RECORDING_TIME * 1000);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Failed to access camera');
      setHasMediaAccess(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingProgress(0);
    }
  };

  const handleUpload = async (videoBlob?: Blob) => {
    if (!videoBlob && !recordedVideo) return;

    setUploading(true);
    setUploadProgress(0);
    setCastHash(null);
    setGifLink(null);

    const formData = new FormData();
    try {
      if (!videoBlob) {
        videoBlob = await fetch(recordedVideo!).then(r => r.blob());
      }
      formData.append('video', videoBlob, 'recorded_video.mp4');
      if (user?.farcaster) {
        formData.append('farcasterUser', JSON.stringify(user.farcaster));
      }
      if (user?.id) {
        formData.append('userId', user.id);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE}/video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is null');
      }
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(value, { stream: true });
        const lines = decodedChunk.split('\n').filter(line => line.trim() !== '');
        lines.forEach(line => {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'progress') {
              setUploadProgress(prev => prev + 20); // Increment progress by 20% for each step
            } else if (parsed.type === 'result') {
              console.log("Received gif link:", parsed.gifLink);
              if (parsed.gifLink && typeof parsed.gifLink === 'string' && parsed.gifLink.trim() !== '') {
                setGifLink(parsed.gifLink);
              } else {
                console.error("Received invalid gif link:", parsed.gifLink);
                setError('Failed to load GIF');
              }
              setCastHash(parsed.castHash);
            }
          } catch (e) {
            console.error('Error parsing server message:', e);
          }
        });
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Failed to upload video');
    } finally {
      setUploading(false);
      setRecordedVideo(null); // Clear the recorded video after upload
    }
  };

  return (
    <>
      <div className="h-full bg-white flex flex-col items-center justify-center p-4 pb-20">
        <motion.h1 
          className={`text-5xl font-bold mb-4 text-black text-center ${lilitaOne.className}`}
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          guarpcast
        </motion.h1>
      
        {authenticated && <button className='bg-purple-600 rounded-xl p-2 text-white mb-2 hover:bg-purple-400' onClick={logout}>logout</button>}
        
        {authenticated ? (
          <>
            
            
            {!hasMediaAccess && (
              <button
                onClick={checkMediaAccess}
                className="w-full mt-2 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300"
              >
                Allow Camera Access
              </button>
            )}
            
            {uploading && (
              <div className="w-full mt-4">
                <ProgressBar progress={uploadProgress} />
              </div>
            )}

            {gifLink && castHash ? (
              <div className="mt-4 w-full">
                <div className="relative w-full aspect-video">
                <Image 
                    unoptimized={true}
                    src={gifLink}
                    alt="uploaded gif"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-md"
                 />
                </div>
                <a 
                  href={`https://www.warpcast.com/~/conversations/${castHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-purple-600 text-white py-2 px-4 mt-4 rounded-md hover:bg-purple-700 transition duration-300"
                >
                  View on Warpcast
                </a>
              </div>
            ) : <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative mb-4">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {isRecording && (
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <ProgressBar progress={recordingProgress} />
              </div>
            )}
          </div>}
          </>
        ) : (
          <motion.p 
            className={`text-center text-gray-600`}
            variants={subtitleVariants}
            initial="hidden"
            animate="visible"
          >
            share yourself
          </motion.p>
        )}

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </div>
      <BottomNav 
        onRecordClick={startRecording}
        isRecording={isRecording}
        stopRecording={stopRecording}
      />
    </>
  );
}