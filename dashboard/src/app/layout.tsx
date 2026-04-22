import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastContainer } from "@/components/layout/Toast";
import { LoginModal } from "@/components/shared/LoginModal";
import { AuthGate } from "@/components/shared/AuthGate";
import { ImagePickerModal } from "@/components/queue/ImagePickerModal";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata: Metadata = {
  title: "Marketing Hub",
  description: "Multi-channel marketing automation dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen flex">
        <Providers>
          <AuthGate>
            <Sidebar />
            <main className="flex-1 min-h-screen overflow-y-auto">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </AuthGate>
          <ToastContainer />
          <LoginModal />
          <ImagePickerModal />
        </Providers>
      </body>
    </html>
  );
}
