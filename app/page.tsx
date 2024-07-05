// app/page.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import BottomNav from '../components/BottomNav';
import ProgressBar from '../components/ProgressBar';

const MAX_RECORDING_TIME = 20; // seconds

export default function Home() {
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(100);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [castHash, setCastHash] = useState(null);
  const [gifLink, setGifLink] = useState(null);
  const [error, setError] = useState(null);
  const { authenticated, user } = usePrivy();
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef?.current?.srcObject = stream;
      mediaRecorderRef?.current = new MediaRecorder(stream);
      
      const chunks = [];
      mediaRecorderRef?.current.ondataavailable = (event) => chunks.push(event.data);
      mediaRecorderRef?.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        setRecordedVideo(URL.createObjectURL(blob));
      };

      mediaRecorderRef?.current.start();
      setIsRecording(true);
      setRecordingProgress(100);

      // Start the timer for progress bar
      let timeLeft = MAX_RECORDING_TIME;
      timerRef?.current = setInterval(() => {
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
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!recordedVideo) return;

    setUploading(true);
    setUploadProgress(0);
    setCastHash(null);
    setGifLink(null);

    const formData = new FormData();
    formData.append('video', await fetch(recordedVideo).then(r => r.blob()), 'recorded_video.mp4');
    if (user?.farcaster) {
      formData.append('farcasterUser', JSON.stringify(user.farcaster));
    }
    formData.append('userId', user.id);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ROUTE}/video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response?.body.getReader();
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
      setRecordedVideo(null); // Clear the recorded video after upload
    }
  };

  return (
    <>
      <div className="h-full bg-white flex flex-col items-center justify-start p-4 pb-20">
        <h1 className="text-2xl font-bold mb-4 text-black text-center">guarpcast</h1>
        
        {authenticated ? (
          <>
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative mb-4">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              {isRecording && (
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <ProgressBar progress={recordingProgress} />
                </div>
              )}
            </div>
            
            {recordedVideo && !isRecording && !gifLink && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-2 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300"
              >
                {uploading ? 'UPLOADING' : 'UPLOAD'}
              </button>
            )}
            
            {uploading && (
              <div className="w-full mt-4">
                <ProgressBar progress={uploadProgress} />
              </div>
            )}

            {gifLink && castHash && (
              <div className="mt-4 w-full">
                <img src={gifLink} alt="Uploaded GIF" className="w-full rounded-md" />
                <a 
                  href={`https://www.warpcast.com/!738435/${castHash.slice(0,10)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-purple-600 text-white py-2 px-4 mt-4 rounded-md hover:bg-purple-700 transition duration-300"
                >
                  View on Warpcast
                </a>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-600">Click the Record button to login and start recording</p>
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