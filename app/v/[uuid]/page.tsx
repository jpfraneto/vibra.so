// app/v/[uuid]/page.tsx
'use client'

import React, { useState, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import BottomNav from '../../../components/BottomNav';
import ProgressBar from '../../../components/ProgressBar';

const MAX_RECORDING_TIME = 20; // seconds

interface VideoPageProps {
  params: {
    uuid: string;
  };
}

export default function VideoPage({ params }: VideoPageProps) {
  const { uuid } = params;
  const videoUrl = `https://res.cloudinary.com/dzpugkpuz/image/upload/v1720177955/videos/uploaded_videos/${uuid}.mov`;
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(100);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [castHash, setCastHash] = useState<string | null>(null);
  const [gifLink, setGifLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { authenticated, user, login } = usePrivy();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    if (!authenticated) {
      login();
      return;
    }

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
        handleUpload(blob);
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

  const handleUpload = async (videoBlob: Blob) => {
    setUploading(true);
    setUploadProgress(0);
    setCastHash(null);
    setGifLink(null);

    const formData = new FormData();
    formData.append('video', videoBlob, 'recorded_video.mp4');
    if (user?.farcaster) {
      formData.append('farcasterUser', JSON.stringify(user.farcaster));
    }
    if (user?.id) {
      formData.append('userId', user.id);
    }

    try {
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
              setGifLink(parsed.gifLink);
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
    }
  };

  return (
    <>
      <div className="h-full bg-black flex flex-col items-center justify-center p-4 pb-20">
        <video 
          ref={videoRef}
          src={isRecording ? undefined : videoUrl} 
          className="w-full h-full object-contain" 
          controls={!isRecording}
          autoPlay 
          loop 
          muted={isRecording}
          playsInline
        />
        
        {isRecording && (
          <div className="absolute bottom-20 left-0 right-0 p-2">
            <ProgressBar progress={recordingProgress} />
          </div>
        )}

        {uploading && (
          <div className="absolute bottom-20 left-0 right-0 p-2">
            <ProgressBar progress={uploadProgress} />
          </div>
        )}

        {gifLink && castHash && (
          <div className="absolute bottom-20 left-0 right-0 p-4 bg-white">
            <a 
              href={`https://www.warpcast.com/!738435/${castHash.slice(0,10)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300"
            >
              View on Warpcast
            </a>
          </div>
        )}

        {error && <p className="absolute bottom-20 left-0 right-0 text-red-500 text-sm text-center p-4">{error}</p>}
      </div>
      <BottomNav 
        onRecordClick={startRecording}
        isRecording={isRecording}
        stopRecording={stopRecording}
      />
    </>
  );
}