"use client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="relative">
      {/* Page Header */}
      {(title || description) && (
        <div className="text-center mb-12">
          {title && (
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white drop-shadow-2xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="mx-auto max-w-2xl text-xl text-white/80 lg:text-2xl leading-relaxed font-light">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Main Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}