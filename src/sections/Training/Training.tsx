import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { roarServices } from '../../config/services';

export const Training: React.FC = () => {
  return (
    <section id="training" className="scroll-mt-20 py-20 md:py-28 bg-[#111111] relative overflow-hidden border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <SectionHeading
            subtitle="OFFICIAL DIRECTORY TRAINING PILLARS"
            title="FIND YOUR"
            highlight="TRAINING STYLE."
            className="mb-0"
          />
          <div className="mt-4 md:mt-0 max-w-md">
            <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
              Eight verified training and fitness disciplines offered at Roar Fitness Nashik, equipped with authentic machinery and dedicated zones.
            </p>
          </div>
        </div>

        {/* Schedule note disclaimer */}
        <div className="mb-10 p-3.5 bg-black/60 border border-white/10 flex items-center gap-2.5 text-xs text-white/60">
          <Info className="w-4 h-4 text-[#FF5A1F] shrink-0" />
          <span>
            Training categories verified from official business directories. Specific batch schedules for group classes (Zumba, CrossFit, Kickboxing) confirmed upon gym enrollment.
          </span>
        </div>

        {/* 8 Category Asymmetrical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roarServices.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group relative bg-[#171717] border border-white/10 overflow-hidden flex flex-col justify-end min-h-[380px] hover:border-[#FF5A1F]/50 transition-colors"
            >
              {/* Background Authentic Image with Zoom */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center filter brightness-[0.4] group-hover:brightness-[0.55] group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/75 to-transparent" />
              </div>

              {/* Number Badge */}
              <div className="absolute top-5 left-5 font-['Anton',sans-serif] text-4xl text-white/20 group-hover:text-[#FF5A1F] transition-colors duration-300">
                {item.number}
              </div>

              {/* Action Link */}
              <div className="absolute top-5 right-5">
                <Link
                  to="/register"
                  className="w-9 h-9 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white group-hover:border-[#FF5A1F] group-hover:bg-[#FF5A1F] transition-all duration-300"
                  aria-label={`Claim pass for ${item.title}`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Content Panel */}
              <div className="relative z-10 p-5 sm:p-6">
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#FF5A1F] mb-1 font-bold">
                  {item.category}
                </p>
                <h3 className="text-xl sm:text-2xl font-['Anton',sans-serif] uppercase text-white mb-2 leading-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-[#A0A0A0] leading-relaxed mb-3 line-clamp-3">
                  {item.description}
                </p>
                <div className="h-[2px] w-0 bg-[#FF5A1F] group-hover:w-full transition-all duration-500 ease-out" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
