"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <main className="flex min-h-screen items-center justify-center p-6">
          <section className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-3 text-slate-600">The application encountered an unexpected error.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => reset()} className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">Retry</button>
              <Link href="/" className="rounded-xl border px-5 py-3 font-semibold">Dashboard</Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
