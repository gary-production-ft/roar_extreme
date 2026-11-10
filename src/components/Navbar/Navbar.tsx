import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight, Lock } from 'lucide-react';
import { AnimatedButton } from '../AnimatedButton/AnimatedButton';
import roarLogoImg from '../../assets/roar/branding/roar-logo.jpg';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // When not on home page, navbar is always opaque to prevent content bleeding
  const isHomePage = location.pathname === '/';
  const showOpaqueNavbar = !isHomePage || isScrolled;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Training', path: '/training' },
    { name: 'Amenities', path: '/#amenities' },
    { name: 'Gallery', path: '/#gallery' },
    { name: 'Location', path: '/#location' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 h-20 flex items-center transition-all duration-300 ${
          showOpaqueNavbar
            ? 'bg-[#080808]/95 backdrop-blur-md border-b border-white/10 shadow-2xl'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-12 w-full flex items-center justify-between">
          {/* Brand Logo with Official Roar Emblem */}
          <Link to="/" className="group flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-[#FF5A1F] shadow-lg shadow-[#FF5A1F]/20 shrink-0">
              <img
                src={roarLogoImg}
                alt="Roar Extreme Official Logo"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-xl sm:text-2xl md:text-3xl font-black font-['Anton',sans-serif] tracking-wider text-white">
              ROAR <span className="text-[#FF5A1F] transition-colors group-hover:text-white">EXTREME</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path && !link.path.includes('#');
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative text-xs uppercase font-semibold tracking-widest transition-colors py-2 px-1 ${
                    isActive ? 'text-[#FF5A1F]' : 'text-[#A0A0A0] hover:text-white'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF5A1F]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              to="/admin/login"
              title="Staff & Admin Portal"
              className="p-2.5 text-white/50 hover:text-[#FF5A1F] transition-colors rounded-lg border border-white/10 hover:border-[#FF5A1F]/40 bg-white/5"
              aria-label="Staff & Admin Portal"
            >
              <Lock className="w-4 h-4" />
            </Link>
            <AnimatedButton to="/register" variant="primary" className="py-2.5 px-5 text-xs">
              CLAIM FREE SESSION <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </AnimatedButton>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FF5A1F] rounded-lg cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-7 h-7 text-[#FF5A1F]" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* Full-Screen Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-30 bg-[#080808] flex flex-col justify-between p-6 sm:p-8 pt-24 pb-8 md:hidden overflow-y-auto overscroll-contain"
          >
            <div className="flex flex-col gap-4 sm:gap-6 my-auto">
              {/* Brand Emblem in Mobile Menu */}
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#FF5A1F] shadow-lg shrink-0">
                  <img
                    src={roarLogoImg}
                    alt="Roar Extreme Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-xl font-['Anton',sans-serif] tracking-wider text-white block leading-tight">
                    ROAR <span className="text-[#FF5A1F]">EXTREME</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase text-white/50 tracking-wider">
                    Vidya Vikas Circle, Nashik
                  </span>
                </div>
              </div>

              <span className="text-[11px] uppercase font-mono tracking-widest text-[#FF5A1F] block">
                Directory & Facilities
              </span>
              {navLinks.map((link, idx) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl sm:text-3xl font-['Anton',sans-serif] uppercase text-white hover:text-[#FF5A1F] transition-colors py-2 flex items-center justify-between border-b border-white/5 active:text-[#FF5A1F]"
                >
                  <span>{link.name}</span>
                  <span className="text-xs font-mono text-white/30">0{idx + 1}</span>
                </Link>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col gap-3 mt-6">
              <AnimatedButton
                to="/register"
                variant="primary"
                className="w-full text-center py-4 text-xs font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                CLAIM FREE SESSION PASS
              </AnimatedButton>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-2.5 text-xs font-mono uppercase text-white/50 hover:text-white transition-colors border border-white/10 rounded-lg bg-white/5"
              >
                <Lock className="w-3.5 h-3.5 text-[#FF5A1F]" />
                <span>Staff & Admin Portal</span>
              </Link>
              <p className="text-[11px] text-[#A0A0A0] text-center font-mono">
                6th Floor Rooftop • Vidya Vikas Circle, Nashik
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
