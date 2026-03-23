import HeroSection from "@/components/HeroSection";
import Header from "@/components/Header";
import Photobooth from "@/components/Photobooth";
import GallerySection from "@/components/GallerySection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fdf1f4]">
      <Header />
      <HeroSection />
      <Photobooth />
      <GallerySection />
    </main>
  );
}

