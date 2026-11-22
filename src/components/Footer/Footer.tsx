import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ExternalLink } from 'lucide-react';
import { businessConfig } from '../../config/business';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#111111] border-t border-white/10 pt-16 pb-12 text-[#A0A0A0]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="text-3xl font-black font-['Anton',sans-serif] tracking-wider text-white">
                ROAR <span className="text-[#FF5A1F]">EXTREME</span>
              </span>
            </Link>
            <p className="text-sm text-[#A0A0A0] font-medium leading-relaxed mb-6">
              "{businessConfig.tagline}"
            </p>
            <p className="text-xs text-white/50 leading-relaxed mb-1">
              {businessConfig.city}'s dedicated rooftop athletic conditioning arena. Strength, cardio, Zumba & CrossFit training.
            </p>
            {/* D15: Single factual note — Google / local directory lists the brand as Roar Fitness */}
            <p className="text-[11px] text-white/30 leading-relaxed mb-4 font-mono">
              Also listed locally as Roar Fitness.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <a
                href={businessConfig.socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="text-[#FF5A1F] hover:underline inline-flex items-center gap-1 font-mono whitespace-nowrap"
              >
                <span>Facebook Page</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <span className="text-white/20">•</span>
              <a
                href={businessConfig.socialLinks.magicpin}
                target="_blank"
                rel="noreferrer"
                className="text-[#FF5A1F] hover:underline inline-flex items-center gap-1 font-mono whitespace-nowrap"
              >
                <span>Magicpin Profile</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
              Quick Navigation
            </h3>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <Link to="/" className="hover:text-[#FF5A1F] transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#FF5A1F] transition-colors">About Facility</Link>
              </li>
              <li>
                <Link to="/training" className="hover:text-[#FF5A1F] transition-colors">Training Programs</Link>
              </li>
              <li>
                <Link to="/#amenities" className="hover:text-[#FF5A1F] transition-colors">Amenities & Facilities</Link>
              </li>
              <li>
                <Link to="/#gallery" className="hover:text-[#FF5A1F] transition-colors">Gym Photo Gallery</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-[#FF5A1F] transition-colors font-semibold text-[#FF5A1F]">
                  Claim Free Session Pass
                </Link>
              </li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-white mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF5A1F]" />
              Operating Hours
            </h3>
            <div className="text-sm space-y-2">
              <p className="font-semibold text-white">{businessConfig.operatingHours.days}</p>
              <p className="text-[#FF5A1F] font-mono text-sm">{businessConfig.operatingHours.hours}</p>
              <p className="text-xs text-white/40 pt-2">{businessConfig.operatingHours.sundayHours}</p>
            </div>
          </div>

          {/* Location & Contact — D16: phone hidden until owner confirms number */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-white mb-6 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF5A1F]" />
              Rooftop Location
            </h3>
            <address className="not-italic text-sm space-y-1 mb-4 text-white/80">
              <p className="font-semibold text-white">{businessConfig.address.primary}</p>
              <p>{businessConfig.address.landmark}, {businessConfig.address.area}</p>
              <p>{businessConfig.address.city}, {businessConfig.address.state}</p>
            </address>

            {/* D16: Only show phone if owner has verified it */}
            {businessConfig.contact.isPhoneVerifiedByOwner && (
              <div className="p-3 bg-black/40 border border-white/5 text-[11px] text-white/60">
                <span className="text-white/40 uppercase block mb-0.5">Contact:</span>
                <span className="font-mono text-[#FF5A1F] font-bold">{businessConfig.contact.phoneFormatted}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar — D15: use brandIdentity, D16: remove Magicpin unverified claim */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 gap-4">
          <p>© {CURRENT_YEAR} {businessConfig.brandIdentity} {businessConfig.city}. All rights reserved.</p>
          <p className="tracking-widest uppercase text-white/30">
            Authentic Brand Integration • Verified Social Sources
          </p>
        </div>
      </div>
    </footer>
  );
};
