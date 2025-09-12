import { ReactNode } from "react";
import { Sidebar } from "@/types/blocks/sidebar";
import SidebarNav from "@/components/console/sidebar/nav";
import ModernBg from "@/components/blocks/hero/ModernBg";

export default async function ConsoleLayout({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar?: Sidebar;
}) {
  return (
    <>
      <ModernBg />
      <div className="relative min-h-screen">
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/5 backdrop-blur-3xl"></div>
        
        <div className="container md:max-w-7xl py-8 mx-auto relative z-10">
          <div className="w-full space-y-6 p-4 pb-16 block">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
              {sidebar?.nav?.items && (
                <aside className="-mx-4 lg:w-1/5">
                  <SidebarNav items={sidebar.nav?.items} />
                </aside>
              )}
              <div className="flex-1 lg:max-w-full">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
