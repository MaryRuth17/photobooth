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
            className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300 supports-[backdrop-filter]:bg-opacity-80"
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Left: Logo */}
                <motion.div
                    className="flex items-center gap-3 cursor-pointer shrink-0"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white shadow-md shadow-accent/20"
                        whileHover={{ boxShadow: "0 0 20px rgba(255, 107, 139, 0.4)" }}
                        transition={{ duration: 0.2 }}
                    >
                        <Camera size={20} />
                    </motion.div>
                    <span className="font-display font-bold text-2xl tracking-tight text-foreground">Yshots</span>
                </motion.div>

                {/* Center: Navigation - perfectly centered */}
                <nav className="hidden md:flex items-center justify-center gap-8 flex-1 font-sans font-medium text-sm text-foreground/75">
                    <motion.a
                        href="#booth"
                        className="relative py-2 transition-colors duration-200"
                        whileHover={{ color: "#FF6B8B" }}
                    >
                        About the Creator
                        <motion.span
                            className="absolute bottom-0 left-0 h-0.5 bg-accent"
                            initial={{ width: 0 }}
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.a>
                    <motion.a
                        href="#gallery"
                        className="relative py-2 transition-colors duration-200"
                        whileHover={{ color: "#FF6B8B" }}
                    >
                        Gallery
                        <motion.span
                            className="absolute bottom-0 left-0 h-0.5 bg-accent"
                            initial={{ width: 0 }}
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.a>
                </nav>

                {/* Right: Start Shooting Button */}
                <motion.button
                    onClick={() => document.getElementById("booth")?.scrollIntoView({ behavior: "smooth" })}
                    className="hidden md:block px-6 py-2.5 rounded-full bg-foreground text-background font-sans font-semibold text-sm shadow-lg shadow-foreground/10 shrink-0"
                    whileHover={{
                        scale: 1.05,
                        boxShadow: "0 20px 25px -5px rgba(74, 51, 55, 0.2)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                >
                    Start Shooting
                </motion.button>

                {/* Mobile quick action */}
                <motion.button
                    onClick={() => document.getElementById("booth")?.scrollIntoView({ behavior: "smooth" })}
                    className="md:hidden flex items-center justify-center p-2 rounded-full bg-foreground text-background shadow-lg shadow-foreground/10 shrink-0"
                    whileHover={{ scale: 1.1, boxShadow: "0 15px 20px -5px rgba(74, 51, 55, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <Camera size={18} />
                </motion.button>
            </div>
        </motion.header>
    );
}
