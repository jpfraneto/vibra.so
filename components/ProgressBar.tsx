import React from 'react';

const ProgressBar = ({ progress }) => {
  return (
    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-linear"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;