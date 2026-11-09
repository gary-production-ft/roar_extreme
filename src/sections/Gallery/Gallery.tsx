import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, X, Image as ImageIcon } from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { roarGallery, type GalleryPhoto } from '../../config/gallery';
import { businessConfig } from '../../config/business';

export const Gallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);

  const categories = [
    { key: 'all', label: 'All Photos' },
    { key: 'gym-interior', label: 'Gym Floor' },
    { key: 'strength-training', label: 'Strength' },
    { key: 'cardio', label: 'Cardio' },
    { key: 'group-fitness', label: 'CrossFit & Zumba' },
    { key: 'facilities', label: 'Amenities' },
  ];

  const filteredPhotos =
    selectedCategory === 'all'
      ? roarGallery
      : roarGallery.filter(
          (p) =>
            p.category === selectedCategory ||
            (selectedCategory === 'group-fitness' && (p.category === 'group-fitness' || p.category === 'kickboxing'))
        );

  return (
    <section id="gallery" className="scroll-mt-20 py-20 md:py-28 bg-[#080808] border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <SectionHeading
            subtitle="AUTHENTIC GYM PHOTOGRAPHY"
            title="INSIDE"
            highlight="ROAR EXTREME."
            className="mb-0"
          />

          {/* Directory Source Badge */}
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <span className="text-xs uppercase font-mono text-[#A0A0A0]">
              SOURCE: {businessConfig.name} NASHIK VERIFIED GALLERY
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-8 sm:mb-10 pb-2 border-b border-white/10 overflow-x-auto no-scrollbar sm:flex-wrap overscroll-contain">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`text-xs uppercase font-semibold tracking-wider px-3.5 sm:px-4 py-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat.key
                  ? 'bg-[#FF5A1F] text-white'
                  : 'bg-white/5 text-[#A0A0A0] hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPhotos.map((photo) => (
              <motion.div
                layout
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                onClick={() => setActivePhoto(photo)}
                className="group relative bg-[#141414] border border-white/10 overflow-hidden cursor-pointer aspect-4/3 flex flex-col justify-end p-5"
              >
                <img
                  src={photo.image}
                  alt={photo.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.6] group-hover:brightness-[0.8] group-hover:scale-105 transition-all duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF5A1F]">
                      {photo.category.replace('-', ' ')}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-white/50 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase truncate">
                    {photo.title}
                  </h4>
                  <p className="text-[11px] text-[#A0A0A0] truncate mt-0.5">
                    {photo.caption}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Modal Lightbox */}
        <AnimatePresence>
          {activePhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePhoto(null)}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full bg-[#111111] border border-white/20 overflow-hidden shadow-2xl"
              >
                <button
                  onClick={() => setActivePhoto(null)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white hover:text-[#FF5A1F] cursor-pointer"
                  aria-label="Close image preview"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="max-h-[70vh] overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={activePhoto.image}
                    alt={activePhoto.title}
                    className="max-h-[70vh] w-auto object-contain mx-auto"
                  />
                </div>

                <div className="p-6 bg-[#171717] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-mono tracking-widest text-[#FF5A1F] block mb-1">
                      {activePhoto.category.replace('-', ' ')} • VERIFIED FACILITY PHOTO
                    </span>
                    <h3 className="text-xl font-bold text-white uppercase">
                      {activePhoto.title}
                    </h3>
                    <p className="text-xs text-[#A0A0A0] mt-1">
                      {activePhoto.caption}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 text-xs font-mono text-white/40">
                    <ImageIcon className="w-4 h-4 text-[#FF5A1F]" />
                    <span>{activePhoto.verifiedSource}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

