import { useEffect, useState, useRef } from 'react';
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function ProgressCircle({ 
  isActive,
  onComplete,
  duration = 20000, // 20 seconds default
  size = 80, 
  strokeWidth = 6, 
  className 
}: ProgressCircleProps) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isActive) {
      // Reset progress when starting
      setProgress(0);
      startTimeRef.current = Date.now();
      
      // Update progress smoothly
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const percentComplete = Math.min((elapsed / duration) * 90, 90); // Max 90% until actual completion
        
        setProgress(Math.round(percentComplete));
        
        // Stop at 90% and wait for actual completion
        if (percentComplete >= 90 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 100); // Update every 100ms for smooth animation
    } else {
      // Clear interval when not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // If progress was above 0, animate to 100% for completion
      if (progress > 0 && progress < 100) {
        // Quickly animate to 100%
        const animateToComplete = () => {
          setProgress(prev => {
            const next = Math.min(prev + 10, 100);
            if (next < 100) {
              setTimeout(animateToComplete, 50);
            } else if (onComplete) {
              setTimeout(onComplete, 500); // Call onComplete after a brief pause
            }
            return next;
          });
        };
        animateToComplete();
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, duration, onComplete]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-600 transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-semibold text-gray-900">{progress}%</span>
      </div>
    </div>
  );
}