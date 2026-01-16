import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import Sidebar from "@/components/blocks/sidebar";
import TopFilterBar from "@/components/blocks/characters/TopFilterBar";
import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";
import Feedback from "@/components/feedback";

export default async function DefaultLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-20 transition-all duration-300 w-full relative">
        {/* Mobile Header */}
        <div className="md:hidden">
          {page.header && <Header header={page.header} />}
        </div>

        {/* Desktop Top Filter Bar (Sticky) */}
        <div className="hidden md:block sticky top-0 z-40">
          <TopFilterBar />
        </div>

        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>
        {page.footer && <Footer footer={page.footer} />}
      </div>

      {/* <Feedback socialLinks={page.footer?.social?.items} /> */}
    </div>
  );
}
