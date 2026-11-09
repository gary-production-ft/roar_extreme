import React from 'react';
import { motion } from 'framer-motion';
import {
  Wind,
  UserCheck,
  Lock,
  BatteryCharging,
  Clock,
  Accessibility,
  Car,
  CheckCircle2,
} from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { roarFacilities, type FacilityAmenity } from '../../config/facilities';
import { businessConfig } from '../../config/business';

export const Amenities: React.FC = () => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Wind':
        return <Wind className="w-5 h-5 text-[#FF5A1F]" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-[#FF5A1F]" />;
      case 'Lock':
        return <Lock className="w-5 h-5 text-[#FF5A1F]" />;
      case 'BatteryCharging':
        return <BatteryCharging className="w-5 h-5 text-[#FF5A1F]" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-[#FF5A1F]" />;
      case 'Accessibility':
        return <Accessibility className="w-5 h-5 text-[#FF5A1F]" />;
      case 'Car':
        return <Car className="w-5 h-5 text-[#FF5A1F]" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-[#FF5A1F]" />;
    }
  };

  return (
    <section id="amenities" className="scroll-mt-20 py-20 md:py-28 bg-[#0D0D0D] border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SectionHeading
          subtitle="FACILITY STANDARDS"
          title="EVERYTHING YOU NEED"
          highlight="TO TRAIN BETTER."
        />

        <p className="text-sm md:text-base text-[#A0A0A0] max-w-2xl mb-12 -mt-6">
          Verified amenities at {businessConfig.name} {businessConfig.city} designed to eliminate friction, maintain hygiene, and provide an athletic conditioning atmosphere.
        </p>

        {/* Amenities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {roarFacilities.map((item: FacilityAmenity, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-[#141414] border border-white/10 p-6 flex flex-col justify-between hover:border-[#FF5A1F]/50 transition-colors group"
            >
              <div>
                <div className="w-12 h-12 rounded-none bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:border-[#FF5A1F] transition-colors">
                  {getIcon(item.iconName)}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider mb-2 font-['Manrope',sans-serif]">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 mt-5 flex items-center justify-between text-[11px] font-mono text-white/40">
                <span>{item.source}</span>
                <span className="text-[#FF5A1F]">0{index + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Photo Feature Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roarFacilities
            .filter((f) => f.image)
            .map((item) => (
              <div
                key={item.id}
                className="relative bg-[#171717] border border-white/10 overflow-hidden group min-h-[260px] flex flex-col justify-end p-6"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4] group-hover:brightness-[0.55] group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#FF5A1F] block mb-1">
                    AUTHENTIC FACILITY PHOTO
                  </span>
                  <h4 className="text-lg font-bold text-white uppercase mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#A0A0A0] max-w-md">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

