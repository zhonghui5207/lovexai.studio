export default function LovexaiLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="love-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff006e" />
          <stop offset="100%" stopColor="#ff5c8d" />
        </linearGradient>
        <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8338ec" />
          <stop offset="100%" stopColor="#3a86ff" />
        </linearGradient>
        <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* The "Love" Curve (Bottom-Left to Top-Right) */}
      {/* Organic, smooth S-curve representing human emotion */}
      <path
        d="M8 32 C8 32 16 32 20 20 C24 8 32 8 32 8"
        stroke="url(#love-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#glow-strong)"
      />

      {/* The "AI" Beam (Top-Left to Bottom-Right) */}
      {/* Digital, segmented line representing technology */}
      <path
        d="M8 8 L16 16"
        stroke="url(#ai-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#glow-strong)"
      />
      <path
        d="M24 24 L32 32"
        stroke="url(#ai-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#glow-strong)"
      />
      
      {/* The Intersection (The "X" Core) */}
      {/* A bright spark where Love meets AI */}
      <circle cx="20" cy="20" r="3" fill="white" filter="url(#glow-strong)" />
      
      {/* Subtle Tech Accents */}
      <rect x="22" y="22" width="2" height="2" fill="white" opacity="0.8" />
      <rect x="26" y="26" width="2" height="2" fill="white" opacity="0.6" />
      
    </svg>
  );
}