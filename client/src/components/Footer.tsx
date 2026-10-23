import React from 'react';
import { Shield, Sparkles, Heart } from 'lucide-react';

interface FooterProps {
  onOpenHowToPlay: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenHowToPlay }) => {
  return (
    <footer className="w-full border-t border-gray-800/60 bg-[#070A11] py-6 px-4 text-xs text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Column */}
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="NumRush" className="w-5 h-5 opacity-80" />
          <span className="font-display font-semibold text-gray-300">NumRush Online</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400">Competitive Multi-Device Number Hunt</span>
        </div>

        {/* Center Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <button 
            onClick={onOpenHowToPlay}
            className="hover:text-cyan-400 transition-colors"
          >
            Game Rules
          </button>
          <span>•</span>
          <span className="hover:text-gray-300 transition-colors cursor-pointer" title="Privacy: No personal data is sold or shared. Match stats only.">
            Privacy Policy
          </span>
          <span>•</span>
          <span className="hover:text-gray-300 transition-colors cursor-pointer" title="Terms: Fair play enforced. Client-side cheating protected by authoritative server.">
            Terms of Fair Play
          </span>
          <span>•</span>
          <a 
            href="mailto:support@numrush.game" 
            className="hover:text-purple-400 transition-colors"
          >
            Support & Feedback
          </a>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
          <span>Engineered for low-latency web & Android</span>
          <Shield className="w-3.5 h-3.5 text-cyan-500" />
        </div>
      </div>
    </footer>
  );
};
