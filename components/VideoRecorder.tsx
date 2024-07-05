// components/VideoRecorder.tsx
import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ onVideoRecorded }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
        onVideoRecorded(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
      {!isRecording && (
        <button
          onClick={startRecording}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition-colors duration-300"
        >
          <Camera size={24} />
        </button>
      )}
      {isRecording && (
        <button
          onClick={stopRecording}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition-colors duration-300"
        >
          Stop
        </button>
      )}
    </div>
  );
};

export default VideoRecorder;