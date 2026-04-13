import Navbar from '@/src/components/Navbar';
import { Footer } from '@/src/components/Sections';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full max-w-[95%] mx-auto bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
