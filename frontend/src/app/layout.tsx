import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Business Digital Twin | Decision Support System",
  description:
    "Interactive AI-driven Digital Twin platform that simulates business scenarios, predicts future outcomes using Machine Learning, and provides actionable recommendations.",
  keywords: [
    "digital twin",
    "business simulation",
    "AI analytics",
    "predictive analytics",
    "decision support",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="bg-mesh" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
