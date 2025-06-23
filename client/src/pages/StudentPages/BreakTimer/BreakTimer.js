import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import './BreakTimer.css';

const BreakTimer = ({ duration, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onFinish();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onFinish]);

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="break-timer-container">
      <h2 className="break-title">Time for a Break!</h2>
      <div className="timer-display">{formatTime()}</div>
      <p className="break-message">Relax and recharge. You've earned it!</p>
      <Button type="default" onClick={onFinish}>
        Finish Break Early
      </Button>
    </div>
  );
};

export default BreakTimer; 