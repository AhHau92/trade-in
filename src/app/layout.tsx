import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trade-in-omega.vercel.app"),
  title: {
    default: "Device Trade-In Platform | Portfolio Demo",
    template: "%s | Device Trade-In Demo",
  },
  description:
    "A full-stack portfolio project for device trade-in estimates, condition-based pricing, bookings, and catalogue administration.",
  applicationName: "Device Trade-In Portfolio Demo",
  authors: [{ name: "Gene Ee Chun Hau" }],
  creator: "Gene Ee Chun Hau",
  openGraph: {
    title: "Device Trade-In Platform | Portfolio Demo",
    description:
      "Explore a working full-stack trade-in flow with server-verified pricing, bookings, and catalogue management.",
    type: "website",
    locale: "en_SG",
    url: "/",
    siteName: "Device Trade-In Portfolio Demo",
  },
  twitter: {
    card: "summary",
    title: "Device Trade-In Platform | Portfolio Demo",
    description:
      "A working full-stack trade-in flow with server-verified pricing, bookings, and catalogue management.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
