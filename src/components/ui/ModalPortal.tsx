"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  overlayClassName?: string;
}

export function ModalPortal({
  isOpen,
  onClose,
  children,
  overlayClassName = "bg-slate-400/30 dark:bg-slate-950/80 backdrop-blur-md",
}: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted || typeof window === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 animate-fade-in ${overlayClassName}`}
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto flex items-center justify-center pointer-events-auto">
        <div className="w-full flex justify-center">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
