import type { Metadata } from "next";
import "./globals.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ThemeProvider } from "./components/ThemeProvider";

export const metadata: Metadata = {
  title: "MTP Collective | Photography",
  description: "MTP Collective Photography - Capturing moments through a unique lens, specializing in concert, automotive, and nature photography.",
  keywords: ["photography", "concert photography", "automotive photography", "nature photography", "MTP Collective"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-black text-white min-h-screen flex flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-grow pt-16">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
