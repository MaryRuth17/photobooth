"use client";

import { Camera } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Header() {
    const { scrollY } = useScroll();
    const background = useTransform(
        scrollY,
        [0, 50],
        ["rgba(253, 241, 244, 0)", "rgba(253, 241, 244, 0.8)"] // from transparent to blush/80
    );
    const backdropBlur = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(12px)"]);
    const borderBottom = useTransform(
        scrollY,
        [0, 50],
        ["1px solid rgba(244, 209, 214, 0)", "1px solid rgba(244, 209, 214, 0.5)"] // to rose/50
    );

    return (
        <motion.header
            // @ts-ignore
            style={{ background, backdropFilter: backdropBlur, borderBottom }}
            className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white shadow-md shadow-accent/20">
                        <Camera size={20} />
                    </div>
                    <span className="font-display font-bold text-2xl tracking-tight text-foreground">Yshots</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 font-sans font-medium text-sm text-foreground/80">
                    <a href="#booth" className="hover:text-accent transition-colors">About the Creator</a>
                    <a href="#gallery" className="hover:text-accent transition-colors">Gallery</a>
                    <button
                        onClick={() => document.getElementById("booth")?.scrollIntoView({ behavior: "smooth" })}
                        className="px-5 py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm"
                    >
                        Start Shooting
                    </button>
                </nav>

                {/* Mobile quick action */}
                <button
                    onClick={() => document.getElementById("booth")?.scrollIntoView({ behavior: "smooth" })}
                    className="md:hidden flex items-center justify-center p-2 rounded-full bg-foreground text-background"
                >
                    <Camera size={18} />
                </button>
            </div>
        </motion.header>
    );
}
