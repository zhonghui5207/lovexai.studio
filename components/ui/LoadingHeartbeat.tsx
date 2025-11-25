"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoadingHeartbeat() {
  const [text, setText] = useState("Syncing emotions...");
  
  useEffect(() => {
    const messages = [
      "Syncing emotions...",
      "Establishing neural link...",
      "Waking up character...",
      "Loading personality matrix...",
      "Connecting to soul..."
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setText(messages[index]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute w-24 h-24 bg-primary/20 rounded-full blur-xl animate-pulse" />
        
        {/* Inner intense glow */}
        <div className="absolute w-12 h-12 bg-primary/40 rounded-full blur-lg animate-ping" />
        
        {/* The Heart Icon */}
        <Heart 
          className="w-16 h-16 text-primary relative z-10 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse" 
          fill="currentColor" 
          strokeWidth={0}
        />
      </div>
      
      {/* Dynamic Text */}
      <div className="mt-8 h-8 flex items-center justify-center">
        <p className="text-lg font-medium text-muted-foreground animate-fade-in transition-all duration-500">
          {text}
        </p>
      </div>
    </div>
  );
}
