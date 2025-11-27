import Sidebar from "@/components/blocks/sidebar";
import { ReactNode } from "react";

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:pl-20 transition-all duration-300 w-full h-screen overflow-hidden">
        {children}
      </main>
    </div>
  );
}





