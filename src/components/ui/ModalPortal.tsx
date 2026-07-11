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
  overlayClassName = "bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm",
}: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted || typeof window === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in ${overlayClassName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className="w-full max-h-[92vh] overflow-y-auto flex items-center justify-center pointer-events-none">
        <div className="w-full pointer-events-auto flex justify-center">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
