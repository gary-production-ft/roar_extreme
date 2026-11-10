import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ExternalLink, Lock } from 'lucide-react';
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
            <p className="text-xs text-white/50 leading-relaxed mb-4">
              {businessConfig.city}'s dedicated athletic conditioning and training studio. General gym, strength, cardio, Zumba, CrossFit & kickboxing.
            </p>
            <div className="flex items-center gap-3 text-xs">
              <a
                href={businessConfig.socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="text-[#FF5A1F] hover:underline inline-flex items-center gap-1 font-mono"
              >
                Facebook Page <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-white/20">•</span>
              <a
                href={businessConfig.socialLinks.magicpin}
                target="_blank"
                rel="noreferrer"
                className="text-[#FF5A1F] hover:underline inline-flex items-center gap-1 font-mono"
              >
                Magicpin Profile <ExternalLink className="w-3 h-3" />
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
                <Link to="/training" className="hover:text-[#FF5A1F] transition-colors">8 Training Disciplines</Link>
              </li>
              <li>
                <a href="/#amenities" className="hover:text-[#FF5A1F] transition-colors">Amenities & Facilities</a>
              </li>
              <li>
                <a href="/#gallery" className="hover:text-[#FF5A1F] transition-colors">Gym Photo Gallery</a>
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

          {/* Location & Contact */}
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

            <div className="p-3 bg-black/40 border border-white/5 text-[11px] text-white/60">
              <span className="text-white/40 uppercase block mb-0.5">Directory Phone:</span>
              <span className="font-mono text-[#FF5A1F] font-bold">{businessConfig.contact.phoneFormatted}</span>
              <span className="block text-[10px] text-white/40 mt-1">Pending owner verification</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 gap-4">
          <p>© {CURRENT_YEAR} {businessConfig.name} Extreme {businessConfig.city}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-white/50 hover:text-[#FF5A1F] transition-colors py-1 px-2.5 rounded border border-white/10 hover:border-[#FF5A1F]/40 bg-white/5"
            >
              <Lock className="w-3 h-3 text-[#FF5A1F]" />
              <span>Staff & Admin Portal</span>
            </Link>
          </div>
          <p className="tracking-widest uppercase text-white/30">
            Authentic Brand Integration • Verified Magicpin & Facebook Sources
          </p>
        </div>
      </div>
    </footer>
  );
};
