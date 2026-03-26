import { Header, Footer, MobileNav } from '@/components/organisms';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
