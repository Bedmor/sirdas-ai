import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <h1 className="text-4xl font-bold font-serif text-white mb-4">404 - Sayfa Bulunamadı</h1>
      <p className="text-slate-400 mb-8 max-w-md">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-medium transition-colors"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
