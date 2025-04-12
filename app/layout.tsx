import type React from "react";
import { Space_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const space = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata = {
  title: "Spotify Receipt",
  description: "Generate a receipt-style summary of your Spotify profile",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={space.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fafafa] ">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

import "./globals.css";
