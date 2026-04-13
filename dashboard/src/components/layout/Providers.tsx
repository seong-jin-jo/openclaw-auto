"use client";

import { ThemeProvider } from "next-themes";
import { SWRConfig } from "swr";
import { ToastProvider } from "./Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SWRConfig value={{ revalidateOnFocus: false, errorRetryCount: 2 }}>
        <ToastProvider>{children}</ToastProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
