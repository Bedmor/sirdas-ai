import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sırdaş AI | Dijital Sırdaş ve Manevi Rehber",
  description:
    "Gönül yaralarına Kur'an, Sünnet ve sahih hikmet ışığında ayna tutan, fıkhi fetva vermeyen, manevi denge ve teskin platformu.",
  keywords: ["Sırdaş AI", "Manevi Rehber", "Halis Aydemir", "İslami Rehberlik", "Tevekkül", "WhatsApp Bot"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
