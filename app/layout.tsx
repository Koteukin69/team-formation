import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Team Formation - Система формирования команд",
    template: "%s | Team Formation",
  },
  description: "Система формирования команд для марафонов и хакатонов. Найдите единомышленников и создайте идеальную команду.",
  keywords: ["хакатон", "марафон", "команда", "геймдев", "game jam", "team formation"],
  authors: [{ name: "Team Formation" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Team Formation",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
