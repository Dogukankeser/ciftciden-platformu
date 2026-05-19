import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Çiftçiden | Dijital Tarım Pazar Yeri",
  description: "Türkiye'nin dijital tarım pazar yeri",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col">
        <script src="https://accounts.google.com/gsi/client" async defer />
        {children}
      </body>
    </html>
  );
}
