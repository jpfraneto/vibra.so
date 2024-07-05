// components/VideoRecorder.tsx
import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

const VideoRecorder = ({ onVideoRecorded }) => {
  const videoRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (event) => chunks.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        setRecordedVideo(URL.createObjectURL(blob));
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
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
      {!isRecording && !recordedVideo && (
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