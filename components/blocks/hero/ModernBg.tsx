export default function ModernBg() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950"></div>
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-indigo-900/20 animate-pulse [animation-duration:8s]"></div>
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse [animation-duration:12s]"></div>
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse [animation-duration:10s] [animation-delay:2s]"></div>
      <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse [animation-duration:14s] [animation-delay:4s]"></div>
      
      {/* Subtle light streaks */}
      <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent opacity-50"></div>
      <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent opacity-30"></div>
      <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent opacity-50"></div>
      <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-30"></div>
    </div>
  );
}