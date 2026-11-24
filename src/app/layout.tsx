import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import { TRPCReactProvider } from "@/trpc/client";
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
  title: "Gerenciador de Tarefas | Next.js 15 + tRPC",
  description:
    "Sistema simples de gerenciamento de tarefas com Next.js 15, tRPC, SSR e Infinite Scroll.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <TRPCReactProvider>
          <ToastProvider>
            <Navbar />
            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
              {children}
            </main>
          </ToastProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
