"use client";

import { motion } from "framer-motion";
import { Camera, ChevronDown } from "lucide-react";
import PixelBlast from "@/components/PixelBlast";

export default function HeroSection() {
    const scrollToBooth = () => {
        const target = document.getElementById("booth");
        if (!target) return;

        const headerHeightValue = getComputedStyle(document.documentElement)
            .getPropertyValue("--header-height")
            .trim();
        const parsedHeaderHeight = Number.parseFloat(headerHeightValue);
        const fallbackHeaderHeight = Number.isFinite(parsedHeaderHeight) ? parsedHeaderHeight : 80;
        const headerElement = document.querySelector("header");
        const renderedHeaderHeight = headerElement?.getBoundingClientRect().height ?? fallbackHeaderHeight;
        const breathingRoom = 16;
        const top = target.getBoundingClientRect().top + window.scrollY - renderedHeaderHeight - breathingRoom;

        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };

    return (
        <section className="relative z-0 isolate viewport-height flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blush to-rose/30">
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                <div style={{ width: "1080px", height: "1080px", position: "relative" }}>
                    <PixelBlast
                        variant="square"
                        pixelSize={3}
                        color="#d65ca9"
                        patternScale={2}
                        patternDensity={1}
                        enableRipples
                        rippleSpeed={0.3}
                        rippleThickness={0.1}
                        rippleIntensityScale={1}
                        speed={0.5}
                        transparent
                        edgeFade={0.5}
                    />
                </div>
            </div>

            <div className="absolute inset-0 z-0 bg-gradient-to-br from-blush/55 via-blush/20 to-rose/35 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-col items-center"
                >
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/50 backdrop-blur-md shadow-sm mb-6 text-accent">
                        <Camera size={28} />
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
                        Pose with <span className="text-accent italic">Yshots</span>
                    </h1>
                    <p className="font-sans text-lg md:text-xl text-foreground/80 max-w-md mb-12 leading-relaxed">
                        Your online cutesy photobooth experience.
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={scrollToBooth}
                        className="flex items-center gap-2 px-8 py-4 rounded-full bg-foreground text-blush font-sans font-medium text-lg shadow-xl shadow-foreground/10 hover:shadow-2xl hover:shadow-foreground/20 transition-shadow cursor-pointer"
                    >
                        Start Your Shoot
                        <ChevronDown size={20} className="mt-0.5" />
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}
