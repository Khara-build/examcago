import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://examcago.com"),
  title: {
    default: "EXAM CAGO — ICAB Certificate Level Online Examination Portal",
    template: "%s | EXAM CAGO",
  },
  description: "Premier online examination and question bank system specifically engineered for ICAB Certificate Level candidates. Practice chapter-wise MCQs or attempt realistic timed full-book exams.",
  keywords: [
    "ICAB",
    "ICAB Certificate Level",
    "ICAB Exam Preparation",
    "Chartered Accountancy Bangladesh",
    "ICAB MCQs",
    "Accounting",
    "Management Information",
    "Business Technology and Finance",
    "Taxation",
    "Assurance",
    "Business Law",
    "Information Technology",
  ],
  authors: [{ name: "EXAM CAGO", url: "https://examcago.com" }],
  creator: "EXAM CAGO",
  publisher: "EXAM CAGO",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://examcago.com",
    siteName: "EXAM CAGO",
    title: "EXAM CAGO — ICAB Certificate Level Online Examination Portal",
    description: "Premier online examination and question bank system specifically engineered for ICAB Certificate Level candidates.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EXAM CAGO — ICAB Certificate Level Online Examination Portal",
    description: "Premier online examination and question bank system specifically engineered for ICAB Certificate Level candidates.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
