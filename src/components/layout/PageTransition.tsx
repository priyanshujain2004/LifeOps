"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const TAB_ORDER: Record<string, number> = {
  "/": 0,
  "/timeline": 1,
  "/trips": 2,
  "/expenses": 3,
  "/analytics": 4,
  "/settings": 5,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef<string>(pathname);
  const [animationClass, setAnimationClass] = useState<string>("animate-slide-left");

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      const prevIdx = TAB_ORDER[prevPathRef.current] ?? 0;
      const newIdx = TAB_ORDER[pathname] ?? 0;

      if (newIdx > prevIdx) {
        // Target is to the right -> slide in from right to left
        setAnimationClass("animate-slide-left");
      } else if (newIdx < prevIdx) {
        // Target is to the left -> slide in from left to right
        setAnimationClass("animate-slide-right");
      } else {
        setAnimationClass("animate-fade-in");
      }

      prevPathRef.current = pathname;
    }
  }, [pathname]);

  return (
    <div key={pathname} className={animationClass}>
      {children}
    </div>
  );
}
