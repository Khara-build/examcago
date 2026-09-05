import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXAM CAGO - ICAB Certificate Level Online Examination Portal",
  description: "Premier online examination and question bank system specifically designed for ICAB Certificate Level students.",
  metadataBase: new URL("https://examcago.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-brand-offwhite text-gray-900 antialiased selection:bg-brand-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
