'use client'

import React, { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { Lilita_One } from 'next/font/google';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, MicOff, Repeat, SwitchCamera, StopCircle, Video, Users, Zap, Globe, Gift, Download } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const lilitaOne = Lilita_One({ subsets: ['latin'], weight: '400' });

const MAX_RECORDING_TIME = 20; // seconds

export default function Home() {
    const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [hasMediaAccess, setHasMediaAccess] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
    const [postDownloadState, setPostDownloadState] = useState(false);
    const [isVibrating, setIsVibrating] = useState(false);
    const [intensity, setIntensity] = useState(1);

    const { authenticated, user } = usePrivy();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const recordedVideoRef = useRef<HTMLVideoElement | null>(null);

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

    useEffect(() => {
      if (recordedVideoRef.current) {
        recordedVideoRef.current.onended = () => {
          recordedVideoRef.current?.play();
        };
      }
    }, [recordedVideo]);
  
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
        if (!streamRef.current) {
          await checkMediaAccess();
        }
        
        if (!streamRef.current) throw new Error('Failed to access media devices');
    
        let options: MediaRecorderOptions = {};
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          options = { mimeType: 'video/mp4' };
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
          options = { mimeType: 'video/webm;codecs=h264' };
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options = { mimeType: 'video/webm' };
        }
    
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    
        const chunks: Blob[] = [];
        mediaRecorderRef.current.ondataavailable = (event) => chunks.push(event.data);
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
          setRecordedVideo(URL.createObjectURL(blob));
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

    const toggleMute = () => {
      if (streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          setIsMuted(!audioTrack.enabled);
        }
      }
    };

    const downloadVideo = () => {
      if (recordedVideo) {
        const a = document.createElement('a');
        a.href = recordedVideo;
        const fileExtension = mediaRecorderRef.current?.mimeType.includes('mp4') ? 'mp4' : 'webm';
        a.download = `vibra_recording.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setPostDownloadState(true);
      }
    };

    const resetRecording = () => {
      setRecordedVideo(null);
      setPostDownloadState(false);
      setError(null);
      checkMediaAccess();
    };

    const handleVibrateClick = () => {
      setIsVibrating(true);
      setIntensity(prev => Math.min(prev + 1, 5));
  
      setTimeout(() => {
        setIsVibrating(false);
        setIntensity(1);
        startRecording();
      }, 3000);
    };

    const phoneClasses = isMobile
      ? "w-[80vw] h-[70vh] mx-auto"
      : "w-[350px] h-[640px] mx-auto";

    const circleCircumference = 2 * Math.PI * 30;
    const strokeDashoffset = circleCircumference - (recordingProgress / 100) * circleCircumference;

    return (
      <div className="min-h-screen bg-yellow-300 font-mono text-black">
        <header className="bg-purple-600 px-4 flex justify-between items-center border-b-4 border-black">
          <h1 className={`text-4xl font-black text-white tracking-tighter ${lilitaOne.className}`}>vibra</h1>
          <nav>
            <a target='_blank' href="https://warpcast.com/~/channel/vibra" className="text-white font-bold mx-2 hover:underline text-lg">/vibra</a>
            <a target='_blank' href="https://warpcast.com/~/compose?text=que+venga+la+buena+%2Fvibra%0A%0Ai+want+early+access+%40jpfraneto%0A%0Ahttps%3A%2F%2Fapi.anky.bot%2Fvibra%2Flanding&embeds%5B%5D=https%3A%2F%2Fapi.anky.bot%2Fvibra%2Flanding" className="text-white font-bold mx-2 hover:underline text-lg">/download</a>
          </nav>
        </header>
        <main className="container mx-auto px-3 mt-4">
          <div className="flex flex-col items-center">
            <div className={`relative ${phoneClasses} bg-purple-200 rounded-3xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden`}>
              {!hasMediaAccess && !recordedVideo && !postDownloadState && (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <h2 className="text-2xl font-black mb-4">welcome to vibra</h2>
                  <p className="text-cyan-500 text-lg font-bold">SHARE WHO YOU ARE</p>
                  <p className="text-purple-500 text-lg font-bold">CONNECT WITH OTHERS</p>
                  <p className="text-yellow-500 text-xl font-black mt-2">stream. be yourself.</p>
                </div>
              )}
              {hasMediaAccess && !recordedVideo && !postDownloadState && (
                <>
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                    autoPlay 
                    playsInline 
                    muted={isMuted}
                  />
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
                </>
              )}
              {recordedVideo && !postDownloadState && (
                <video 
                  ref={recordedVideoRef}
                  className="w-full h-full object-cover"
                  src={recordedVideo}
                  autoPlay
                  loop
                  playsInline
                />
              )}
              {postDownloadState && (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <p className="text-xl font-bold mb-4">soon, that video will be a cast</p>
                  <p className="text-cyan-500 text-lg font-bold">you get the point</p>
                  <p className="text-purple-500 text-lg font-bold">stay tuned</p>
                  <a href="https://warpcast.com/~/channel/vibra" target="_blank" rel="noopener noreferrer" className="text-yellow-500 text-xl font-black mt-2 hover:underline">/vibra</a>
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
              </div>
              {isRecording && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full font-bold animate-pulse">
                  Recording...
                </div>
              )}
              <div className="w-5/6 mx-auto absolute fixed bottom-4 left-0 right-0 shadow-lg rounded-lg">
                <BottomNav
                  onRecordClick={handleVibrateClick}
                  isVibrating={isVibrating}
                  stopRecording={stopRecording}
                  isRecording={isRecording}
                  hasRecordedVideo={!!recordedVideo}
                  onDownloadClick={downloadVideo}
                  onResetClick={resetRecording}
                />
            </div>
            </div>
          
          <div className="mt-8 w-full px-4 max-w-2xl">
            <div className="bg-white p-6 rounded-md shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-black mb-8">
              <p className="text-xl mb-6 text-center font-bold">
                vibra is a video-based Farcaster client that brings a fresh perspective to being social onchain.
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
                  <span className="text-lg font-bold text-center">Be Yourself</span>
                </div>
              </div>
            </div>

            <div className="bg-cyan-300 p-6 rounded-md shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-black">
              <h3 className="text-3xl font-black mb-4">Farcaster</h3>
              <p className="text-lg mb-4">
                Vibra&apos;s identity is powered by the Farcaster protocol, bringing you a decentralized and community-driven social experience.
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

      <footer className="bg-purple-600 text-white text-center p-4 mt-8 pb-20 border-t-4 border-black">
        <p className="text-lg font-bold">&copy; 2024 Vibra. All rights reserved.</p>
        <p className="text-base">Powered by Farcaster & Moxie</p>
      </footer>
    </div>
  );
}