import HeroSection from "@/components/HeroSection";
import Header from "@/components/Header";
import Photobooth from "@/components/Photobooth";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <Photobooth />
    </main>
  );
}
