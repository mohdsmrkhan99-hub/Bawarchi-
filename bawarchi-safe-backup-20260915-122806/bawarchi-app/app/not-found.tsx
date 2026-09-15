export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
      <section className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-3 text-slate-600">The requested page does not exist.</p>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">Dashboard</Link>
      </section>
    </main>
  );
}
import Link from "next/link";
