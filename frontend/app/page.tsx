// app/page.tsx
import TopNav from '@/components/TopNav';
import Header from '@/components/Header';
import BannerSlider from '@/components/BannerSlider';
import SidebarCategories from '@/components/SidebarCategories';
import HomeContent from '@/components/HomeContent';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <SidebarCategories />
          </div>
          <div className="lg:w-3/4">
            <BannerSlider />
            <HomeContent />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}