import type { Metadata } from "next";
import { Amiri, Noto_Naskh_Arabic, Space_Grotesk, Roboto_Slab } from "next/font/google";
import "./globals.css";
import { yaziBoyutuBetigi, temaBetigi } from "@/lib/gorunum-betikleri";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-arabic",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manevi Pusula - Manevi Tefekkür & Rehberlik",
  description:
    "Kur'an-ı Kerim, Sahih Sünnet ve kadim hikmet rehberliğinde; keder, rızık darlığı ve gelecek endişelerinde ilahi rızayı ve sükûneti arayanlara samimi bir dertleşme ve tefekkür alanı.",
  keywords: [
    "Manevi Pusula",
    "Manevi Rehber",
    "İslami Rehberlik",
    "Tevekkül",
    "Tefekkür",
  ],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className="dark"
      style={{ scrollBehavior: "smooth" }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: yaziBoyutuBetigi + temaBetigi }} />
      </head>
      <body
        className={`${amiri.variable} ${notoNaskhArabic.variable} ${spaceGrotesk.variable} ${robotoSlab.variable} bg-background font-body text-on-surface antialiased min-h-screen selection:bg-secondary-container selection:text-on-secondary-container spiritual-bg-pattern`}
      >
        {children}
      </body>
    </html>
  );
}
