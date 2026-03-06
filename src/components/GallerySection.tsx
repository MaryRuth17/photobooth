"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Photo = {
  id: number;
  imageData: string;
  createdAt: string;
};

export default function GallerySection() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/gallery");
        if (!res.ok) return;
        const data = await res.json();
        setPhotos(data.photos ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!loading && photos.length === 0) {
    return null;
  }

  return (
    <section
      id="gallery"
      className="bg-white dark:bg-[#111] border-t border-zinc-100 dark:border-zinc-900 py-12 md:py-16"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-foreground">
              Community Gallery
            </h2>
            <p className="font-sans text-sm text-foreground/60 mt-1 max-w-md">
              With permission, we showcase some of the cutest shots created in this booth.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-foreground/60 font-sans">Loading gallery…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageData}
                  alt="Gallery photo"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

