import type { Metadata } from "next";
import { VT323, Inter } from "next/font/google";
import "./globals.css";

const vt323 = VT323({
  weight: '400',
  subsets: ["latin"],
  variable: "--font-vt323",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pixel Perfect | AI Pixel Art Converter",
  description: "Convert AI-generated images into clean, production-ready pixel art sprites.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👾</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${vt323.variable} ${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
