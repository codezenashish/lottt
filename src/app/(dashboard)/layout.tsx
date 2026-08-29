import TopNavbar from "@/components/navigation/top-navbar";
import Sidebar from "@/components/navigation/sidebar";
import MobileDock from "@/components/navigation/mobile-dock";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="text-foreground bg-background font-sans flex flex-col h-screen max-w-7xl mx-auto w-full relative overflow-hidden">
      <header className="sticky top-0 z-50 flex flex-col shrink-0 w-full">
        <TopNavbar />
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] min-h-0 w-full overflow-hidden">
        <aside className="hidden lg:block border-r border-border overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden h-full bg-card/20">
          <Sidebar />
        </aside>

        <main className="min-w-0 overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full pb-24 lg:pb-0 px-4 md:px-6 py-4">
          {children}
        </main>
      </div>

      <MobileDock />
    </div>
  );
}
