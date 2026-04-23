"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InfoTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function InfoTooltip({
  content,
  children,
  className = "",
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="cursor-help border-b border-dotted border-white/30 decoration-white/30 transition-colors hover:border-mint hover:text-mint focus-visible:border-mint focus-visible:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#16171a]"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="More information"
        aria-describedby={isVisible ? "tooltip-content" : undefined}
      >
        {children}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            id="tooltip-content"
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-1/2 z-[100] mb-2 w-64 -translate-x-1/2 rounded-lg border border-white/10 bg-[#16171a] p-2.5 text-xs leading-relaxed text-slate-200 shadow-2xl backdrop-blur-md"
          >
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b border-r border-white/10 bg-[#16171a]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
