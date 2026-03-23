"use client";

import { motion } from "framer-motion";
import { Camera, ChevronDown } from "lucide-react";

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
            {/* Background Animated Blobs */}
            <motion.div
                className="absolute z-0 pointer-events-none top-1/4 left-1/4 w-96 h-96 bg-rose/40 rounded-full blur-3xl mix-blend-multiply"
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute z-0 pointer-events-none bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl mix-blend-multiply"
                animate={{
                    x: [0, -40, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div
                className="absolute z-0 pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[500px] bg-petal/60 rounded-full blur-3xl mix-blend-multiply"
                animate={{
                    rotate: [0, 90, 180, 270, 360],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />

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
