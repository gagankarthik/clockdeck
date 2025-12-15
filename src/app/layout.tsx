import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/* -------------------------------------------------------------------------- */
/*                                SEO METADATA                                 */
/* -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  metadataBase: new URL("https://clockdeck.vercel.app/"), // 🔴 change to your real domain
  title: {
    default: "ClockDeck — Time Tracking for Property Teams",
    template: "%s · ClockDeck",
  },
  description:
    "ClockDeck is a simple, reliable time tracking platform for property managers. Track employee hours, manage properties, and export clean timesheet reports.",
  applicationName: "ClockDeck",
  keywords: [
    "time tracking",
    "employee clock in clock out",
    "property management software",
    "timesheet software",
    "staff time tracking",
    "payroll timesheets",
    "workforce management",
  ],
  authors: [{ name: "ClockDeck" }],
  creator: "ClockDeck",
  publisher: "ClockDeck",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "ClockDeck — Time Tracking for Property Teams",
    description:
      "Track employee hours across properties, manage staff, and export accurate timesheets — without spreadsheets.",
    url: "https://clockdeck.vercel.app/", // 🔴 change to your real domain
    siteName: "ClockDeck",
    images: [
      {
        url: "/logo.svg", // 🔴 add this image in /public
        width: 1200,
        height: 630,
        alt: "ClockDeck time tracking dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ClockDeck — Time Tracking for Property Teams",
    description:
      "Simple employee time tracking for property managers. Clean timesheets, accurate reports.",
    images: ["/logo.svg"],
    creator: "@clockdeck", // optional
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },


};

/* -------------------------------------------------------------------------- */
/*                                ROOT LAYOUT                                  */
/* -------------------------------------------------------------------------- */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}
      >
        <main>{children}</main>
        <Toaster/>
      </body>
    </html>
  );
}
