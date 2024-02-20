import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { InternalStateProvider, IsClientCtxProvider } from "../components/provider";
import lang from "../data/lang/en.json";

const inter = Inter({ subsets: ["latin"] });

// actually no clue how to access the specific language here
// probably have to fetch language from local storage?
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
        <InternalStateProvider>
          <IsClientCtxProvider>
            {children}
          </IsClientCtxProvider>
        </InternalStateProvider>
      </body>
    </html>
  );
}
