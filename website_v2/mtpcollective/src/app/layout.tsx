import type { Metadata } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: "MTP Collective | Photography",
  description: "MTP Collective Photography - Capturing moments through a unique lens, specializing in concert, automotive, and nature photography.",
  keywords: ["photography", "concert photography", "automotive photography", "nature photography", "MTP Collective"],
  authors: [{ name: "MTP Collective" }],
  openGraph: {
    title: "MTP Collective | Photography",
    description: "MTP Collective Photography - Capturing moments through a unique lens.",
    url: "https://mtpcollective.com",
    siteName: "MTP Collective",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MTP Collective | Photography",
    description: "MTP Collective Photography - Capturing moments through a unique lens.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${inter.variable} ${instrumentSans.variable} font-sans bg-black text-white min-h-screen flex flex-col antialiased`}
      >
        <Navbar />
        <main className="flex-grow pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
