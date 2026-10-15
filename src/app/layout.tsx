import type { Metadata } from "next";
import { Amiri, Cinzel, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const amiri = Amiri({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cinzel",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

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
      <body
        className={`${amiri.variable} ${cinzel.variable} ${plusJakarta.variable} min-h-screen bg-background font-sans antialiased selection:bg-amber-500/25 selection:text-amber-200`}
      >
        {children}
      </body>
    </html>
  );
}

