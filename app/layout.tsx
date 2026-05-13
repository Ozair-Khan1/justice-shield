import type { Metadata } from "next";
import "@livekit/components-styles";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Justice Shield — On-Demand Attorney Defense",
  description:
    "24/7 instant attorney access for police encounters and civil matters. Deploy a vetted lawyer in under 30 seconds.",
  authors: [{ name: "Justice Shield" }],
  openGraph: {
    title: "Justice Shield — On-Demand Attorney Defense",
    description:
      "24/7 instant attorney access for police encounters and civil matters. Deploy a vetted lawyer in under 30 seconds.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Justice Shield — On-Demand Attorney Defense",
    description:
      "24/7 instant attorney access for police encounters and civil matters. Deploy a vetted lawyer in under 30 seconds.",
  },
  icons: {
    icon: [
      { url: "/favicon.webp" },
      { url: "/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { url: "/icon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: [{ url: "/apple-touch-icon.webp", sizes: "180x180", type: "image/webp" }],
  },
  manifest: "/site.webmanifest",
  other: {
    "apple-mobile-web-app-title": "Justice Shield",
    "apple-mobile-web-app-capable": "yes",
  },
};

import { LoadingProvider } from "@/components/LoadingProvider";
import { Toaster } from "sonner";
import { GlobalNotificationListener } from "@/components/GlobalNotificationListener";
import { NotificationProvider } from "@/lib/NotificationProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="bg-titanium-950 text-titanium-50">
        <LoadingProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
              <GlobalNotificationListener />
              <Toaster
                position="top-right"
                theme="dark"
                expand={false}
                richColors={true}
                toastOptions={{
                  className: "border-titanium-800 bg-titanium-900 text-titanium-50",
                }}
              />
            </NotificationProvider>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
