import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import './BreakTimer.css';

const BreakTimer = ({ duration, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0 && !isTimeUp) {
      setIsTimeUp(true);
      return;
    }

    if (!isTimeUp) {
      const intervalId = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [timeLeft, isTimeUp]);

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    return isTimeUp ? '#ff4d4f' : '#1890ff'; // Red when time is up, blue otherwise
  };

  const getMessage = () => {
    if (isTimeUp) {
      return "Break time is up! Click 'End Break' when you're ready to continue.";
    }
    return "Relax and recharge. You've earned it!";
  };

  const getButtonText = () => {
    return isTimeUp ? "End Break" : "Finish Break Early";
  };

  return (
    <div className="break-timer-container">
      <h2 className="break-title" style={{ color: getTimerColor() }}>
        {isTimeUp ? "Break Time Complete!" : "Time for a Break!"}
      </h2>
      <div className="timer-display" style={{ color: getTimerColor() }}>
        {formatTime()}
      </div>
      <p className="break-message" style={{ color: getTimerColor() }}>
        {getMessage()}
      </p>
      <Button 
        type={isTimeUp ? "primary" : "default"} 
        danger={isTimeUp}
        onClick={onFinish}
      >
        {getButtonText()}
      </Button>
    </div>
  );
};

export default BreakTimer; 