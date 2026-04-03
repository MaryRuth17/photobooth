"use client";

import { Camera } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Header() {
    const { scrollY } = useScroll();
    const background = useTransform(
        scrollY,
        [0, 80],
        ["linear-gradient(120deg, #f6bbdd 0%, #e6a8d7 55%, #d796d1 100%)", "linear-gradient(120deg, #f5b2d8 0%, #df9fd1 58%, #cc8ac8 100%)"]
    );
    const borderColor = useTransform(
        scrollY,
        [0, 80],
        ["rgba(248, 228, 240, 0.95)", "rgba(248, 228, 240, 0.98)"]
    );
    const shadow = useTransform(scrollY, [0, 80], ["0 16px 34px -22px rgba(135, 70, 111, 0.42)", "0 20px 38px -20px rgba(123, 53, 102, 0.5)"]);

    const scrollToSection = (id: string) => {
        const target = document.getElementById(id);
        if (!target) return;

        const headerHeightValue = getComputedStyle(document.documentElement)
            .getPropertyValue("--header-height")
            .trim();
        const parsedHeaderHeight = Number.parseFloat(headerHeightValue);
        const fallbackHeaderHeight = Number.isFinite(parsedHeaderHeight) ? parsedHeaderHeight : 80;
        const headerElement = document.querySelector("header");
        const renderedHeaderHeight = headerElement?.getBoundingClientRect().height ?? fallbackHeaderHeight;
        const breathingRoom = 28;
        const headerOffset = renderedHeaderHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - breathingRoom;

        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };

    return (
        <motion.header className="sticky top-0 z-50 px-3 sm:px-5 pt-2.5 sm:pt-3">
            <motion.div
                style={{ background, borderColor, boxShadow: shadow }}
                className="header-shell-floating relative mx-auto max-w-7xl overflow-hidden rounded-full border transition-colors duration-300"
            >
                <div className="pointer-events-none absolute inset-0">
                    <div className="header-gradient-flow" />
                    <div className="header-gradient-orb header-gradient-orb-left" />
                    <div className="header-gradient-orb header-gradient-orb-right" />
                </div>

                <div className="relative px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-3">
                {/* Left: Logo */}
                <motion.div
                    className="group flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    whileHover={{ scale: 1.02, x: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent text-white shadow-md shadow-accent/20"
                        whileHover={{
                            rotate: -8,
                            boxShadow: "0 0 26px rgba(255, 107, 139, 0.45)",
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <Camera size={17} />
                    </motion.div>
                    <div className="leading-tight">
                        <p className="font-display font-bold text-lg sm:text-xl tracking-tight text-foreground group-hover:text-accent transition-colors duration-300 whitespace-nowrap">
                            Yshots Photobooth
                        </p>
                        <p className="hidden sm:block text-[10px] uppercase tracking-[0.15em] text-foreground/55 group-hover:text-foreground/75 transition-colors duration-300">
                            Capture the moment, keep the vibe
                        </p>
                    </div>
                </motion.div>

                {/* Center: Navigation - perfectly centered */}
                <nav className="hidden lg:flex items-center justify-center gap-6 flex-1 font-sans font-medium text-sm text-white/85">
                    <motion.button
                        type="button"
                        onClick={() => scrollToSection("booth")}
                        className="header-nav-link py-2 px-1"
                        whileHover={{ color: "#FFD7EB", y: -1 }}
                    >
                        About the Creator
                        <span className="header-nav-underline" />
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={() => scrollToSection("gallery")}
                        className="header-nav-link py-2 px-1"
                        whileHover={{ color: "#FFD7EB", y: -1 }}
                    >
                        Gallery
                        <span className="header-nav-underline" />
                    </motion.button>
                </nav>

                {/* Right: Start Shooting Button */}
                <motion.button
                    onClick={() => scrollToSection("booth")}
                    className="hidden lg:block header-cta px-5 py-2 rounded-full bg-white/92 text-[#b84695] font-sans font-semibold text-sm shadow-lg shadow-fuchsia-900/20 shrink-0"
                    style={{ transformPerspective: 900, transformStyle: "preserve-3d" }}
                    whileHover={{
                        scale: 1.03,
                        y: -2,
                        z: 24,
                        boxShadow: "0 26px 34px -10px rgba(122, 24, 79, 0.5)",
                        filter: "drop-shadow(0 0 22px rgba(253, 124, 191, 0.6))",
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    Start Shooting
                </motion.button>

                {/* Mobile quick action */}
                <motion.button
                    onClick={() => scrollToSection("booth")}
                    className="lg:hidden flex items-center justify-center p-2 rounded-full bg-white/92 text-[#b84695] shadow-lg shadow-fuchsia-900/20 shrink-0"
                    whileHover={{ scale: 1.1, boxShadow: "0 15px 20px -5px rgba(74, 51, 55, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <Camera size={18} />
                </motion.button>
            </div>
            </motion.div>
        </motion.header>
    );
}
