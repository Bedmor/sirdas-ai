import type { Metadata } from "next";
import { Amiri, Titillium_Web, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const amiri = Amiri({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-titillium",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sırdaş AI - Manevi Tefekkür & Rehberlik",
  description:
    "Kur'an-ı Kerim, Sahih Sünnet ve kadim hikmet rehberliğinde; keder, rızık darlığı ve gelecek endişelerinde ilahi rızayı ve sükûneti arayanlara samimi bir dertleşme ve tefekkür alanı.",
  keywords: ["Sırdaş AI", "Manevi Rehber", "Halis Aydemir", "İslami Rehberlik", "Tevekkül", "WhatsApp Bot"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" style={{ scrollBehavior: "smooth" }} suppressHydrationWarning>
      <body
        className={`${amiri.variable} ${titilliumWeb.variable} ${plusJakarta.variable} bg-background font-body text-on-surface antialiased min-h-screen selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern`}
      >
        {children}
      </body>
    </html>
  );
}



