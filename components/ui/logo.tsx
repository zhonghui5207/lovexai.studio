export default function LovexaiLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background gradient circle */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main circle background */}
      <circle cx="16" cy="16" r="15" fill="url(#logoGradient)" opacity="0.9" filter="url(#glow)" />
      
      {/* AI-inspired geometric pattern */}
      <g transform="translate(16,16)">
        {/* Central diamond */}
        <path d="M0,-6 L4,-2 L0,2 L-4,-2 Z" fill="white" opacity="0.9" />
        
        {/* Neural network nodes */}
        <circle cx="-6" cy="-4" r="1.5" fill="white" opacity="0.7" />
        <circle cx="6" cy="-4" r="1.5" fill="white" opacity="0.7" />
        <circle cx="-6" cy="4" r="1.5" fill="white" opacity="0.7" />
        <circle cx="6" cy="4" r="1.5" fill="white" opacity="0.7" />
        
        {/* Connection lines */}
        <line x1="-6" y1="-4" x2="-2" y2="-3" stroke="white" strokeWidth="0.8" opacity="0.6" />
        <line x1="6" y1="-4" x2="2" y2="-3" stroke="white" strokeWidth="0.8" opacity="0.6" />
        <line x1="-6" y1="4" x2="-2" y2="1" stroke="white" strokeWidth="0.8" opacity="0.6" />
        <line x1="6" y1="4" x2="2" y2="1" stroke="white" strokeWidth="0.8" opacity="0.6" />
        
        {/* Love heart symbol (subtle) */}
        <path d="M-1,-1 C-1,-2 0,-2 0,-1 C0,-2 1,-2 1,-1 C1,0 0,1.5 0,1.5 C0,1.5 -1,0 -1,-1 Z" 
              fill="white" opacity="0.4" transform="scale(0.8)" />
      </g>
    </svg>
  );
}