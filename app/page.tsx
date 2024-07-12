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
import { Camera, Mic, MicOff, Repeat, SwitchCamera, StopCircle, Video, Users, Zap, Globe, Gift } from 'lucide-react';
import mime from 'mime-types';

const lilitaOne = Lilita_One({ subsets: ['latin'], weight: '400' });

const MAX_RECORDING_TIME = 20; // seconds

export default function Home() {
    const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [castHash, setCastHash] = useState<string | null>(null);
    const [gifLink, setGifLink] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [hasMediaAccess, setHasMediaAccess] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  
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
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
  
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
  
      return () => {
        window.removeEventListener('resize', checkIfMobile);
        stopMediaTracks();
      };
    }, []);
  
    useEffect(() => {
      if (authenticated) {
        checkMediaAccess();
      }
    }, [authenticated, cameraFacingMode]);
  
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
      stopMediaTracks();
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
        setRecordingProgress(0);
    
        let timeLeft = MAX_RECORDING_TIME;
        timerRef.current = setInterval(() => {
          timeLeft -= 0.1;
          const progress = ((MAX_RECORDING_TIME - timeLeft) / MAX_RECORDING_TIME) * 100;
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
      console.log("The user is: ", user)
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

      console.log("after the response", response)
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
  
      const result = await response.json();
      console.log("ALOJA", result)
  
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

  const phoneClasses = isMobile
    ? "w-[80vw] h-[70vh] mx-auto"
    : "w-[350px] h-[640px] mx-auto";

  const circleCircumference = 2 * Math.PI * 30;
  const strokeDashoffset = circleCircumference - (recordingProgress / 100) * circleCircumference;

  return (
    <div className=" min-h-screen bg-yellow-300 font-mono text-black">
      <header className="bg-purple-600 p-4 flex justify-between items-center border-b-4 border-black">
        <h1 className={`text-4xl font-black text-white tracking-tighter ${lilitaOne.className}`}>vibra</h1>
        <nav>
          <a target='_blank' href="https://warpcast.com/~/channel/vibra" className="text-white font-bold mx-2 hover:underline text-lg">/vibra</a>
          <a target='_blank' href="https://warpcast.com/~/compose?text=que+venga+la+buena+%2Fvibra%0A%0Ai+want+early+access+%40jpfraneto%0A%0Ahttps%3A%2F%2Fapi.anky.bot%2Fvibra%2Flanding&embeds%5B%5D=https%3A%2F%2Fapi.anky.bot%2Fvibra%2Flanding" className="text-white font-bold mx-2 hover:underline text-lg">/download</a>
        </nav>
      </header>
      <main className="container mx-auto mt-4">
        <div className="flex flex-col items-center">
          <div className={`relative ${phoneClasses} bg-purple-200 rounded-3xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden`}>
            <video 
              ref={videoRef} 
              className={`w-full h-full object-cover ${hasMediaAccess ? 'block' : 'hidden'}`}
              autoPlay 
              playsInline 
              muted={isMuted}
            />
            {!hasMediaAccess && (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <h2 className="text-2xl font-black mb-4">welcome to vibra</h2>
                <p className="text-cyan-500 text-lg font-bold">SHARE WHO YOU ARE</p>
                <p className="text-purple-500 text-lg font-bold">CONNECT WITH OTHERS</p>
                <p className="text-yellow-500 text-xl font-black mt-2">stream. be yourself.</p>
              </div>
            )}
            {hasMediaAccess && (
              <div className="absolute top-2 right-2 flex space-x-2">
                <button
                  onClick={toggleMute}
                  className="p-2 bg-white bg-opacity-50 rounded-full hover:bg-opacity-75 transition duration-300"
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                  onClick={switchCamera}
                  className="p-2 bg-white bg-opacity-50 rounded-full hover:bg-opacity-75 transition duration-300"
                >
                  <SwitchCamera size={20} />
                </button>
              </div>
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <svg className="w-20 h-20">
                <circle
                  cx="40"
                  cy="40"
                  r="30"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="4"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-red-500'} rounded-full font-bold active:background-yellow-500 flex items-center justify-center transition-colors duration-300 shadow-[4px_4px_0_0_rgba(0,0,0,1)]`}
              >
                {isRecording ? (
                  <StopCircle size={24} className="text-white" />
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </button>
            </div>
            {isRecording && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full font-bold animate-pulse">
                Recording...
              </div>
            )}
          </div>
          
          <div className="mt-8 w-full max-w-2xl">
            <div className="bg-white p-6 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-black mb-8">
              <p className="text-xl mb-6 text-center font-bold">
                vibra is a video-based Farcaster client bringing a fresh perspective to social media.
              </p>

              <div className="flex justify-center space-x-8 mb-8">
                <div className="flex flex-col items-center">
                  <Video className="text-purple-600 mb-2" size={36} />
                  <span className="text-lg font-bold">Stream</span>
                </div>
                <div className="flex flex-col items-center">
                  <Users className="text-cyan-500 mb-2" size={36} />
                  <span className="text-lg font-bold">Connect</span>
                </div>
                <div className="flex flex-col items-center">
                  <Camera className="text-yellow-500 mb-2" size={36} />
                  <span className="text-lg font-bold">Be Yourself</span>
                </div>
              </div>
            </div>

            <div className="bg-cyan-300 p-6 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-black">
              <h3 className="text-3xl font-black mb-4">Built on Farcaster</h3>
              <p className="text-lg mb-4">
                vibra is powered by the Farcaster protocol, bringing you a decentralized and community-driven social experience.
              </p>
              <div className="flex justify-around">
                <div className="flex flex-col items-center">
                  <Zap className="text-purple-600 mb-2" size={32} />
                  <span className="text-base font-bold">Fast & Efficient</span>
                </div>
                <div className="flex flex-col items-center">
                  <Globe className="text-purple-600 mb-2" size={32} />
                  <span className="text-base font-bold">Farcaster Network</span>
                </div>
                <div className="flex flex-col items-center">
                  <Gift className="text-purple-600 mb-2" size={32} />
                  <span className="text-base font-bold">Community Driven</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-purple-600 text-white text-center p-4 mt-8 pb-16 border-t-4 border-black">
        <p className="text-lg font-bold">&copy; 2024 Vibra. All rights reserved.</p>
        <p className="text-base">Powered by Farcaster & Moxie</p>
      </footer>
    </div>
  );
}