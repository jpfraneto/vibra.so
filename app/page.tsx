// app/page.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import BottomNav from '../components/BottomNav';
import Image from 'next/image';
import ProgressBar from '../components/ProgressBar';
import { Lilita_One } from 'next/font/google';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, MicOff, Repeat, SwitchCamera } from 'lucide-react';
import mime from 'mime-types';

const lilitaOne = Lilita_One({ subsets: ['latin'], weight: '400' });

const MAX_RECORDING_TIME = 20; // seconds

export default function Home() {
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(100);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [castHash, setCastHash] = useState<string | null>(null);
  const [gifLink, setGifLink] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [hasMediaAccess, setHasMediaAccess] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const { authenticated, user, logout, login } = usePrivy();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopMediaTracks();
    };
  }, []);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    if (authenticated) {
      checkMediaAccess();
    }
  }, [authenticated, cameraFacingMode]);

  const syncVideoPlayback = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = videoRef.current.currentTime;
    }
    requestAnimationFrame(syncVideoPlayback);
  };

  useEffect(() => {
    if (videoRef.current) {
      requestAnimationFrame(syncVideoPlayback);
      
      const handleLoadedMetadata = () => {
        videoRef.current?.play().catch(error => console.error('Error playing video:', error));
      };
      
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const checkMediaAccess = async () => {
    try {
      const constraints = { 
        video: isMobile ? { facingMode: cameraFacingMode } : true,
        audio: true 
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasMediaAccess(true);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setHasMediaAccess(false);
      setError('Failed to access camera and microphone. Please check your permissions.');
    }
  };
  

  const switchCamera = async () => {
    setCameraFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    await checkMediaAccess();
  };

  const startRecording = async () => {
    try {
      setError("");
      setUploading(false);
      if (!streamRef.current) {
        await checkMediaAccess();
      }
      
      if (!streamRef.current) throw new Error('Failed to access media devices');
  
      let options;
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        options = { mimeType: 'video/webm;codecs=h264' };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else {
        throw new Error('No supported video codec');
      }
  
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
  
      
      const chunks: Blob[] = [];
      mediaRecorderRef.current.ondataavailable = (event) => chunks.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        setRecordedVideo(URL.createObjectURL(blob));
        handleUpload(blob);
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingProgress(100);
  
      let timeLeft = MAX_RECORDING_TIME;
      timerRef.current = setInterval(() => {
        timeLeft -= 0.1;
        const progress = (timeLeft / MAX_RECORDING_TIME) * 100;
        setRecordingProgress(progress);
        if (timeLeft <= 0) {
          stopRecording();
        }
      }, 100);
  
      setTimeout(stopRecording, MAX_RECORDING_TIME * 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording: ' + (error as Error).message);
      setHasMediaAccess(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingProgress(0);
    }
  };

  function getFileExtensionFromMimeType(mimeType: string): string {
    switch (mimeType) {
      case 'video/webm':
        return '.webm';
      case 'video/mp4':
        return '.mp4';
      case 'video/quicktime':
        return '.mov';
      default:
        console.warn(`Unknown mime type: ${mimeType}, defaulting to .mp4`);
        return '.mp4';
    }
  }

  const handleUpload = async (videoBlob: Blob) => {
    setUploading(true);
    setUploadProgress(0);
    setCastHash(null);
    setGifLink("");
  
    const formData = new FormData();
    try {
      // Determine the correct file extension based on the blob's type
      const fileExtension = getFileExtensionFromMimeType(videoBlob.type);
      formData.append('video', videoBlob, `recorded_video.${mime.extension(videoBlob.type)}`);
      
      if (user?.farcaster) {
        formData.append('farcasterUser', JSON.stringify(user.farcaster));
      }
      if (user?.id) {
        formData.append('userId', user.id);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE}/video`, {
        method: 'POST',
        headers: {
          'Origin': 'https://www.guarpcast.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      const result = await response.json();
  
      if (result.error) {
        throw new Error(result.error);
      }
  
      if (result.gifLink && typeof result.gifLink === 'string' && result.gifLink.trim() !== '') {
        setGifLink(result.gifLink);
        setCastHash(result.castHash);
        setUploadProgress(100);
      } else {
        throw new Error('Received invalid GIF link');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Failed to upload video');
    } finally {
      setUploading(false);
      setRecordedVideo(null);
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const resetRecording = () => {
    setGifLink("");
    setCastHash(null);
    setError(null);
    checkMediaAccess();
  };

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
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

  return (
    <div className="h-full bg-gradient-to-b from-purple-100 to-purple-300 flex flex-col items-center justify-center flex-grow">
      <main className='grow flex flex-col w-full items-center justify-center'>
        <motion.h1 
          className={`text-5xl font-bold mb-4 text-purple-800 text-center ${lilitaOne.className}`}
          variants={titleVariants}
          initial="hidden"
          animate="visible"
        >
          guarpcast
        </motion.h1>
        
        <AnimatePresence mode="wait">
          {authenticated ? (
            <motion.div
              key="authenticated"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="w-full rounded-lg shadow-lg overflow-hidden rounded-xl px-2">
                {gifLink && castHash ? (
                  <div className="p-4 w-full">
                    <div className="relative w-full aspect-video mb-4">
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
                      className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300"
                    >
                      View on Warpcast
                    </a>
                    <button
                      onClick={resetRecording}
                      className="mt-2 w-full flex items-center justify-center bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-300"
                    >
                      <Repeat className="mr-2" size={18} />
                      new video
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={`relative w-full ${isMobile ? "h-full" : "aspect-video" } bg-black`}>
                      <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover" 
                        autoPlay 
                        playsInline 
                        muted={isMuted}
                      />
                      {isRecording && (
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <ProgressBar progress={recordingProgress} />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex space-x-2">
                        <button
                          onClick={toggleMute}
                          className="p-2 bg-white bg-opacity-50 rounded-full hover:bg-opacity-75 transition duration-300"
                        >
                          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        {isMobile && (
                          <button
                            onClick={switchCamera}
                            className="p-2 bg-white bg-opacity-50 rounded-full hover:bg-opacity-75 transition duration-300"
                          >
                            <SwitchCamera size={20} />
                          </button>
                        )}
                      </div>
                    </div>
              
                    {!hasMediaAccess && (
                      <button
                        onClick={checkMediaAccess}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300 flex items-center justify-center"
                      >
                        <Camera className="mr-2" size={18} />
                        Allow Camera Access
                      </button>
                    )}
                    {uploading && (
                      <div className="w-full mt-4">
                        <ProgressBar progress={uploadProgress} />
                        <p className="text-center mt-2 text-sm text-gray-600">
                          Uploading video, transforming it into a GIF, and casting it. Please wait...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="unauthenticated"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.p 
                className={`text-center text-purple-800 mb-4 ${lilitaOne.className}`}
                variants={subtitleVariants}
                initial="hidden"
                animate="visible"
              >
                share yourself
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p 
            className="text-red-500 text-sm mt-4 bg-white px-4 py-2 rounded-full shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {error}
          </motion.p>
        )}
      </main>
      <BottomNav 
        onRecordClick={startRecording}
        isRecording={isRecording}
        stopRecording={stopRecording}
      />
    </div>
  );
}