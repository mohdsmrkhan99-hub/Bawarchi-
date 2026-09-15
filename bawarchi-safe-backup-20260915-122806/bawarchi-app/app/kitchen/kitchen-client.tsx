"use client";

import { useEffect, useState } from "react";

type KOT = Awaited<ReturnType<typeof import("@/app/orders/actions").getKitchenData>>[number];
type Filter = "ALL" | "NEW" | "PREPARING" | "READY" | "DELAYED";

const nextStatus: Record<string, string> = { NEW: "PREPARING", PREPARING: "READY", READY: "SERVED" };

export default function KitchenClient({ initialKots }: { initialKots: KOT[] }) {
  const [kots, setKots] = useState(initialKots);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(async () => {
      setNow(Date.now());
      const response = await fetch("/api/kitchen", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      if (result.success) setKots(result.data);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  async function advance(kot: KOT) {
    const status = nextStatus[kot.status];
    if (!status) return;
    const response = await fetch("/api/kitchen", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kotId: kot.id, status }) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message || "Unable to update kitchen order.");
    setMessage("");
    setKots(old => old.map(item => item.id === kot.id ? { ...item, status: status as KOT["status"], items: item.items.map(line => ({ ...line, status: status === "PREPARING" ? "PREPARING" : status === "READY" ? "READY" : "SERVED" })) } : item));
  }

  const visible = kots.filter(kot => filter === "ALL" || (filter === "DELAYED" ? now - new Date(kot.createdAt).getTime() > 15 * 60 * 1000 && kot.status !== "READY" : kot.status === filter));
  return <main className="min-h-screen bg-slate-950 p-4 text-white sm:p-6">
    <header className="mx-auto mb-6 flex max-w-7xl flex-wrap items-center gap-3">
      <div className="mr-auto"><p className="text-xs font-bold uppercase tracking-[.25em] text-blue-300">New Bawarchi</p><h1 className="text-2xl font-black">Kitchen Display</h1></div>
      {(["ALL", "NEW", "PREPARING", "READY", "DELAYED"] as Filter[]).map(value => <button key={value} onClick={() => setFilter(value)} className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === value ? "bg-blue-500" : "bg-slate-800 text-slate-300"}`}>{value === "ALL" ? "All" : value}</button>)}
    </header>
    {message && <p className="mx-auto mb-4 max-w-7xl rounded-lg bg-red-500/20 p-3 text-sm text-red-200">{message}</p>}
    <section className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visible.map(kot => <article key={kot.id} className={`rounded-2xl border p-5 ${kot.status === "NEW" ? "border-blue-400 bg-blue-950/50" : kot.status === "READY" ? "border-emerald-400 bg-emerald-950/40" : "border-amber-400 bg-amber-950/40"}`}>
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-black">{kot.kotNumber}</h2><p className="text-sm text-slate-300">{kot.order.orderNumber} · {kot.order.orderType.replace("_", " ")}{kot.order.table ? ` · Table ${kot.order.table.tableNumber}` : ""}</p></div><span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold">{kot.status}</span></div><p className="mt-2 text-sm font-bold text-orange-200">Elapsed {Math.floor((now - new Date(kot.createdAt).getTime()) / 60000)}m</p>
        <ul className="my-5 space-y-3">{kot.items.map(item => <li key={item.id} className="flex justify-between gap-3 text-lg"><span>{item.itemName}{item.variantName ? ` (${item.variantName})` : ""}{item.notes ? <small className="block text-sm text-slate-300">Note: {item.notes}</small> : null}</span><b>× {item.quantity}</b></li>)}</ul>
        {kot.notes && <p className="mb-4 rounded-lg bg-black/20 p-3 text-sm">Order note: {kot.notes}</p>}
        {nextStatus[kot.status] && <button onClick={() => advance(kot)} className="w-full rounded-xl bg-white px-4 py-3 text-base font-black text-slate-900">{kot.status === "NEW" ? "START" : kot.status === "PREPARING" ? "MARK READY" : "MARK SERVED"}</button>}
      </article>)}
      {!visible.length && <p className="col-span-full rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">No kitchen orders in this view.</p>}
    </section>
  </main>;
}
