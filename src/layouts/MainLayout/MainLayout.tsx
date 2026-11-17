import React, { lazy, Suspense } from 'react';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../../components/Footer/Footer';
import { CustomCursor } from '../../components/CustomCursor/CustomCursor';
import { Preloader } from '../../components/Preloader/Preloader';
import { ScrollProgress } from '../../components/ScrollProgress/ScrollProgress';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';

const ChatbotWidget = lazy(() =>
  import('../../components/Chatbot/ChatbotWidget').then((m) => ({ default: m.ChatbotWidget }))
);

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  useSmoothScroll();

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col relative selection:bg-[#FF5A1F] selection:text-white">
      <Preloader />
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Suspense fallback={null}>
        <ChatbotWidget />
      </Suspense>
      <Footer />
    </div>
  );
};
