import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation, Calendar, Phone, ExternalLink } from 'lucide-react';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { AnimatedButton } from '../../components/AnimatedButton/AnimatedButton';
import { businessConfig } from '../../config/business';

export const Location: React.FC = () => {
  return (
    <section id="location" className="scroll-mt-20 py-20 md:py-28 bg-[#080808] relative overflow-hidden border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <SectionHeading
          subtitle="FIND THE SANCTUARY"
          title="THE TRAINING"
          highlight="GROUNDS."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 bg-[#111111] border border-white/10 p-6 sm:p-8 md:p-10 flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 text-[#FF5A1F] font-bold text-xs uppercase tracking-widest mb-6">
                <MapPin className="w-3.5 h-3.5" />
                ROOFTOP LOCATION
              </div>

              <h3 className="text-2xl sm:text-3xl font-['Anton',sans-serif] uppercase text-white mb-6 tracking-wide">
                {businessConfig.name} {businessConfig.city.toUpperCase()}
              </h3>

              <div className="flex flex-col gap-5 text-sm text-[#A0A0A0]">
                {/* Address block - Supplied directly by business */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#FF5A1F]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-bold text-sm leading-snug">
                        Official Studio Address
                      </h4>
                      <span className="text-[10px] bg-[#FF5A1F]/15 text-[#FF5A1F] border border-[#FF5A1F]/30 px-1.5 py-0.5 font-mono uppercase font-bold">
                        Verified Studio
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
                      {businessConfig.address.fullFormatted}
                    </p>
                    <p className="text-[11px] text-white/50 mt-1 font-mono">
                      Landmark: Vidya Vikas Circle, above Axis Bank (Patil Colony, Canada Corner)
                    </p>
                  </div>
                </div>

                {/* Operating hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-[#FF5A1F]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm mb-1 leading-snug">
                      Operating Hours
                    </h4>
                    <p className="text-white font-mono text-xs sm:text-sm font-semibold mb-0.5">
                      {businessConfig.operatingHours.days}: {businessConfig.operatingHours.hours}
                    </p>
                    <p className="text-xs text-white/50">
                      Sunday: {businessConfig.operatingHours.sundayHours}
                    </p>
                  </div>
                </div>

                {/* Phone Contact with Pending Owner Confirmation */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-[#FF5A1F]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-bold text-sm leading-snug">
                        Directory Helpline
                      </h4>
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 font-mono uppercase">
                        Pending Confirmation
                      </span>
                    </div>
                    <p className="text-white font-mono text-xs sm:text-sm font-semibold mb-0.5">
                      {businessConfig.contact.phoneFormatted}
                    </p>
                    <p className="text-[11px] text-white/40">
                      {businessConfig.contact.phonePendingNotice}
                    </p>
                  </div>
                </div>

                {/* Arrival Protocol */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-[#FF5A1F]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm mb-1 leading-snug">
                      Terrace Access Protocol
                    </h4>
                    <p className="text-xs sm:text-sm text-[#A0A0A0] leading-relaxed">
                      Take elevator to 5th floor of Rushiraj Regency, then take the dedicated staircase flight to the 6th floor rooftop fitness arena.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 mt-6 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={businessConfig.address.googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center font-bold uppercase tracking-wider text-xs px-5 py-3.5 bg-[#FF5A1F] text-white hover:bg-[#FF7545] transition-all cursor-pointer select-none"
                >
                  <Navigation className="w-3.5 h-3.5 mr-2" />
                  GET DIRECTIONS
                </a>
                <AnimatedButton to="/register" variant="outline" className="w-full py-3.5 text-xs">
                  BOOK SESSION
                </AnimatedButton>
              </div>

              {/* Verified Links */}
              <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
                <a
                  href={businessConfig.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#FF5A1F] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-[#FF5A1F]" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.808C10.595 0 9 1.583 9 4.615V8z"/>
                  </svg>
                  Facebook Page <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={businessConfig.socialLinks.magicpin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#FF5A1F] transition-colors"
                >
                  Magicpin Store <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Interactive Map Visual */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 bg-[#171717] border border-white/10 relative overflow-hidden min-h-[300px] sm:min-h-[420px] flex flex-col"
          >
            {/* Embed Map Canvas */}
            <iframe
              title="Roar Fitness Official Studio Location Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3749.127546682664!2d73.7634457!3d20.0094151!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bddeb99f3d80043%3A0xe11b269b99a6d07e!2sRoar%20Fitness!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              className="w-full h-full min-h-[300px] sm:min-h-[420px] border-0 filter grayscale invert contrast-125 opacity-80 hover:opacity-100 transition-opacity duration-500"
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Corner Badge */}
            <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-md border border-[#FF5A1F]/40 px-3 py-1.5 flex items-center gap-2 pointer-events-none shadow-xl">
              <span className="w-2 h-2 rounded-full bg-[#FF5A1F] animate-ping" />
              <span className="text-[10px] sm:text-xs font-mono text-white uppercase tracking-wider font-semibold">
                601/602 Rushiraj Regency • Above Axis Bank
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
