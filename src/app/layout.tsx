import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { IsClientCtxProvider } from "../components/provider";
import lang from "../data/lang/en.json";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: lang.any.title,
  description: lang.any.description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <IsClientCtxProvider>
          {children}
        </IsClientCtxProvider>
      </body>
    </html>
  );
}
