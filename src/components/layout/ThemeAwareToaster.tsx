"use client";

import React from "react";
import { Toaster } from "sonner";
import { useTheme } from "./ThemeProvider";

export function ThemeAwareToaster() {
  const { theme } = useTheme();
  return <Toaster position="top-center" richColors theme={theme} />;
}
