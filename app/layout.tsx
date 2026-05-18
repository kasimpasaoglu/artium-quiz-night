import type { Metadata } from "next";
import { Toaster } from "sonner";
import { FONT_WHITELIST_VARIABLES } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artium Quiz Night",
  description: "Artium Sahne ve Sanat Merkezi quiz gecesi sunum platformu",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={FONT_WHITELIST_VARIABLES}>
      <body className="min-h-screen">
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
