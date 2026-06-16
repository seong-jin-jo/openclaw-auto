import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { ToastContainer } from "@/components/layout/Toast";
import { LoginModal } from "@/components/shared/LoginModal";
import { AuthGate } from "@/components/shared/AuthGate";
import { ImagePickerModal } from "@/components/queue/ImagePickerModal";

export const metadata: Metadata = {
  title: "Marketing Hub",
  description: "Multi-channel marketing automation dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>
          <AuthGate>{children}</AuthGate>
          <ToastContainer />
          <LoginModal />
          <ImagePickerModal />
        </Providers>
      </body>
    </html>
  );
}
