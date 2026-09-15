/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

type Data = Awaited<ReturnType<typeof import("./actions").getOrderData>>;
type Item = { menuItemId: string; menuVariantId: string; name: string; variantName: string; price: number; quantity: number; notes: string };
type Customer = { customerName: string; customerPhone: string; customerAddress: string; notes: string; discount: string; tax: string; serviceCharge: string; deliveryCharge: string };
type AnyOrder = any;
const blankCustomer: Customer = { customerName: "", customerPhone: "", customerAddress: "", notes: "", discount: "0", tax: "0", serviceCharge: "0", deliveryCharge: "0" };
const nextStatus: Record<string, string> = { PLACED: "CONFIRMED", KOT_SENT: "PREPARING", PREPARING: "READY", READY: "SERVED", COMPLETED: "ARCHIVED", CANCELLED: "ARCHIVED" };
const tidy = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase();
const money = (n: number | string) => `₹${Number(n || 0).toFixed(2)}`;

export default function OrdersClient({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData);
  const [type, setType] = useState("DINE_IN");
  const [cart, setCart] = useState<Record<string, Item>>({});
  const [floorId, setFloorId] = useState(""), [sectionId, setSectionId] = useState(""), [table, setTable] = useState("");
  const [menuSearch, setMenuSearch] = useState(""), [orderSearch, setOrderSearch] = useState(""), [category, setCategory] = useState("all"), [status, setStatus] = useState("all");
  const [customer, setCustomer] = useState<Customer>(blankCustomer), [editing, setEditing] = useState<AnyOrder>(null);
  const [variantItem, setVariantItem] = useState<any>(null), [selectedOrder, setSelectedOrder] = useState<AnyOrder>(null), [confirmation, setConfirmation] = useState<AnyOrder>(null), [message, setMessage] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDisplayDate(new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const floor = data.floors.find((f: any) => f.id === floorId);
  const sections = floor?.sections ?? [];
  const selectedSection = sections.find((s: any) => s.id === sectionId);
  const availableTables = (selectedSection ? selectedSection.tables : floor?.tables ?? []).filter((t: any) => t.status === "AVAILABLE");
  const categories = useMemo(() => {
    const query = tidy(menuSearch);
    return data.menu.filter((c: any) => category === "all" || c.id === category).map((c: any) => ({
      ...c,
      items: c.items.filter((i: any) => !query || tidy(i.name).includes(query) || tidy(c.name).includes(query)),
    })).filter((c: any) => c.items.length);
  }, [data.menu, category, menuSearch]);
  const subtotal = Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - Number(customer.discount || 0) + Number(customer.tax || 0) + Number(customer.serviceCharge || 0) + Number(customer.deliveryCharge || 0));
  const setCustomerValue = (key: keyof Customer, value: string) => setCustomer((c) => ({ ...c, [key]: value }));

  function add(item: any, variant: any) {
    const key = `${item.id}:${variant.id}`;
    setCart((old) => ({ ...old, [key]: { menuItemId: item.id, menuVariantId: variant.id, name: item.name, variantName: variant.name, price: Number(variant.price), quantity: (old[key]?.quantity || 0) + 1, notes: old[key]?.notes || "" } }));
    setVariantItem(null);
  }
  function chooseItem(item: any) { if (item.variants.length === 1) add(item, item.variants[0]); else setVariantItem(item); }
  function change(key: string, quantity: number) { setCart((old) => { const next = { ...old }; if (quantity < 1) delete next[key]; else next[key] = { ...next[key], quantity }; return next; }); }
  function selectFloor(id: string) { setFloorId(id); setSectionId(""); setTable(""); }
  function selectSection(id: string) { setSectionId(id); setTable(""); }

  async function submit() {
    const items = Object.values(cart).map(({ menuItemId, menuVariantId, quantity, notes }) => ({ menuItemId, menuVariantId, quantity, notes }));
    if (!items.length) return setMessage("Add at least one menu item.");
    if (type === "DINE_IN" && !table) return setMessage("Select floor, section, and table for dine-in.");
    if (type === "DELIVERY" && !customer.customerAddress.trim()) return setMessage("Delivery address is required.");
    setMessage("");
    const payload = editing ? { action: "update", orderId: editing.id, version: editing.version, ...customer, items } : { orderType: type, tableId: type === "DINE_IN" ? table : undefined, ...customer, items };
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message || "Unable to save order.");
    const saved = result.data;
    if (editing) {
      setData((d) => ({ ...d, orders: d.orders.map((o: any) => o.id === editing.id ? { ...o, ...saved } : o) }));
      setMessage("Order changes saved.");
    } else {
      const snapshot = { ...saved, items: saved.items || items.map((i: any) => ({ ...i, itemName: cart[`${i.menuItemId}:${i.menuVariantId}`]?.name, variantName: cart[`${i.menuItemId}:${i.menuVariantId}`]?.variantName, unitPrice: cart[`${i.menuItemId}:${i.menuVariantId}`]?.price })), subtotal, total, orderType: type, customerName: customer.customerName, customerPhone: customer.customerPhone, customerAddress: customer.customerAddress, notes: customer.notes, table: table ? { tableNumber: availableTables.find((t: any) => t.id === table)?.tableNumber, floor: { name: floor?.name }, section: selectedSection ? { name: selectedSection.name } : null } : null };
      setData((d) => ({ ...d, orders: [snapshot, ...d.orders] }));
      setConfirmation(snapshot);
    }
    newOrder();
  }
  async function move(order: AnyOrder, next: string) {
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "status", orderId: order.id, status: next, version: order.version }) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message || "Unable to update status.");
    setData((d) => ({ ...d, orders: d.orders.map((o: any) => o.id === order.id ? { ...o, status: next, version: o.version + 1 } : o) }));
  }
  async function sendToKitchen(order: AnyOrder) {
    const response = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "kot", orderId: order.id, idempotencyKey: `kot-${order.id}` }) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message || "Unable to send order to kitchen.");
    setData((d) => ({ ...d, orders: d.orders.map((o: any) => o.id === order.id ? { ...o, status: "KOT_SENT", version: o.version + 1 } : o) }));
  }
  async function createBill(order: AnyOrder) {
    const response = await fetch("/api/billing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "bill", orderId: order.id, idempotencyKey: `bill-${order.id}` }) });
    const result = await response.json();
    if (!response.ok) return setMessage(result.error?.message || "Unable to create bill.");
    setData((d) => ({ ...d, orders: d.orders.map((o: any) => o.id === order.id ? { ...o, status: "BILLED", version: o.version + 1 } : o) }));
    setMessage(`${result.data.billNumber} created. Open Billing to record payment.`);
  }
  function edit(order: AnyOrder) {
    setEditing(order); setType(order.orderType); setTable(order.tableId || ""); setFloorId(""); setSectionId("");
    setCustomer({ customerName: order.customerName || "", customerPhone: order.customerPhone || "", customerAddress: order.customerAddress || "", notes: order.notes || "", discount: String(order.discount || 0), tax: String(order.tax || 0), serviceCharge: String(order.serviceCharge || 0), deliveryCharge: String(order.deliveryCharge || 0) });
    setCart(Object.fromEntries(order.items.map((i: any) => [`${i.menuItemId}:${i.menuVariantId}`, { menuItemId: i.menuItemId, menuVariantId: i.menuVariantId, name: i.itemName, variantName: i.variantName || "", price: Number(i.unitPrice), quantity: i.quantity, notes: i.notes || "" }])));
  }
  function newOrder() { setEditing(null); setCart({}); setTable(""); setFloorId(""); setSectionId(""); setCustomer({ ...blankCustomer }); }
  const visibleOrders = data.orders.filter((o: any) => {
    const q = tidy(orderSearch);
    return (status === "all" || o.status === status) && (!q || tidy(o.orderNumber).includes(q) || tidy(o.customerName || "").includes(q) || o.items.some((i: any) => tidy(i.itemName).includes(q)));
  });

  return <main className="h-[100dvh] overflow-hidden bg-[#f6f8fb] text-slate-900">
    <div className="grid h-full min-w-0 min-[1000px]:grid-cols-[210px_minmax(0,1fr)_380px]">
      <aside className="hidden min-w-0 shrink-0 flex-col bg-[#101b32] px-4 py-5 text-white min-[1000px]:flex">
        <div className="mb-10 flex items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500 text-lg font-black">B</div><div><p className="font-bold tracking-wide">BAWARCHI</p><p className="text-[10px] uppercase tracking-[.2em] text-slate-400">Restaurant POS</p></div></div>
        <nav className="space-y-1 text-sm"><a className="flex items-center gap-3 rounded-xl bg-blue-500 px-3 py-3 font-semibold" href="#new-order">▣ <span>New order</span></a><a className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-300 hover:bg-white/10" href="#history">◷ <span>Order history</span></a><a className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-300 hover:bg-white/10" href="/menu">☷ <span>Menu</span></a><a className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-300 hover:bg-white/10" href="/tables">▦ <span>Tables</span></a></nav>
        <div className="mt-auto rounded-2xl bg-white/10 p-3 text-xs text-slate-300"><p className="font-semibold text-white">Today&apos;s service</p><p className="mt-2">{data.orders.length} active orders</p><p className="mt-1 text-emerald-300">● System online</p></div>
      </aside>
      <section className="flex min-w-0 flex-col overflow-hidden" id="new-order">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 sm:px-8 sm:py-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-600 sm:text-xs">Point of sale</p><h1 className="truncate text-xl font-bold tracking-tight sm:mt-1 sm:text-2xl">New order</h1><p className="hidden text-xs text-slate-500 sm:block">{editing ? `Editing ${editing.orderNumber}` : "Build an order and send it to the kitchen"}{displayDate ? ` · ${displayDate}` : ""}</p></div><div className="flex items-center gap-2 sm:gap-3"><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">● Open</span><button onClick={newOrder} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm sm:px-4 sm:py-2.5 sm:text-sm">+ New order</button></div></header>
        <nav className="flex shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-4 py-2 text-xs font-bold min-[1000px]:hidden"><a href="#new-order" className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700">New order</a><a href="#history" className="rounded-lg px-3 py-2 text-slate-500">History</a><button onClick={() => setCartOpen(true)} className="ml-auto rounded-lg px-3 py-2 text-slate-500">Cart ({Object.values(cart).reduce((n, i) => n + i.quantity, 0)})</button></nav>
        {message && <div className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:mx-8">{message}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-24 sm:px-8 sm:py-4 sm:pb-4">
          <div className="mb-4 flex flex-wrap rounded-xl bg-slate-200/70 p-1 sm:w-fit">{["DINE_IN", "TAKEAWAY", "DELIVERY"].map(t => <button key={t} onClick={() => setType(t)} className={`rounded-lg px-5 py-2 text-xs font-bold tracking-wide transition ${type === t ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{t === "DINE_IN" ? "DINE IN" : t}</button>)}</div>
          {type === "DINE_IN" && <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold">Table location</p><p className="text-xs text-slate-500">Choose where this order will be served</p></div>{table && <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">Table {availableTables.find((t: any) => t.id === table)?.tableNumber}</span>}</div><div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2"><select className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" value={floorId} onChange={e => selectFloor(e.target.value)}><option value="">Floor</option>{data.floors.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}</select><select className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" value={sectionId} onChange={e => selectSection(e.target.value)} disabled={!floorId}><option value="">Section</option>{sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" value={table} onChange={e => setTable(e.target.value)} disabled={!floorId || (!selectedSection && sections.length > 0)}><option value="">Table</option>{availableTables.map((t: any) => <option key={t.id} value={t.id}>Table {t.tableNumber} · {t.capacity} seats</option>)}</select></div>{table && <p className="mt-3 text-xs text-slate-500">Selected identity: {floor?.name}{selectedSection ? ` / ${selectedSection.name}` : ""} / Table {availableTables.find((t: any) => t.id === table)?.tableNumber}</p>}</div>}
          <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2"><div className="sm:col-span-2"><p className="text-sm font-bold">Customer details <span className="font-normal text-slate-400">(optional)</span></p></div>{[["customerName", "Customer name"], ["customerPhone", "Phone number"], ...(type === "DELIVERY" ? [["customerAddress", "Delivery address"], ["notes", "Delivery instructions"]] : type === "TAKEAWAY" ? [["notes", "Order notes"]] : [])].map(([key, label]) => <input key={key} placeholder={label} value={(customer as any)[key]} onChange={e => setCustomerValue(key as keyof Customer, e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />)}</div>
          <div className="mb-4 flex items-center gap-3"><div className="relative flex-1"><span className="absolute left-3 top-2.5 text-slate-400">⌕</span><input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-blue-500" placeholder="Search menu items" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} /></div></div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setCategory("all")} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${category === "all" ? "bg-blue-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>All items</button>{data.menu.map((c: any) => <button key={c.id} onClick={() => setCategory(c.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${category === c.id ? "bg-blue-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>{c.name}</button>)}</div>
          {categories.map((c: any) => <div key={c.id} className="mb-7"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold">{c.name}</h2><span className="text-xs text-slate-400">{c.items.length} items</span></div><div className="grid grid-cols-2 gap-3 min-[1000px]:grid-cols-2 min-[1250px]:grid-cols-3">{c.items.map((item: any) => <article key={item.id} className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md sm:p-4"><div className="mb-3 flex h-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 text-3xl sm:h-20">🍽️</div><h3 className="truncate font-bold">{item.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{item.variants.length > 1 ? `${item.variants.length} sizes available` : `From ${money(item.variants[0]?.price)}`}</p><button onClick={() => chooseItem(item)} className="mt-3 w-full rounded-xl bg-blue-50 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white sm:mt-4">Add to order <span className="ml-1">+</span></button></article>)}</div></div>)}
          <section id="history" className="border-t border-slate-200 pt-6"><div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="mr-auto text-lg font-bold">Order history</h2><input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" placeholder="Search orders" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} /><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{["PLACED", "CONFIRMED", "KOT_SENT", "PREPARING", "READY", "SERVED", "BILLED", "PAID", "COMPLETED", "CANCELLED"].map(s => <option key={s}>{s}</option>)}</select></div><div className="grid gap-3 md:grid-cols-2">{visibleOrders.map((o: any) => <article className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300" key={o.id} onClick={() => setSelectedOrder(o)}><div className="flex justify-between"><b className="text-sm">{o.orderNumber}</b><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{o.status}</span></div><p className="mt-1 text-xs text-slate-500">{o.orderType.replace("_", " ")} · {money(o.total)}</p><p className="my-2 line-clamp-2 text-xs">{o.items.map((i: any) => `${i.itemName} ×${i.quantity}`).join(", ")}</p><div className="flex gap-2" onClick={e => e.stopPropagation()}>{["DRAFT", "PLACED", "CONFIRMED", "PREPARING"].includes(o.status) && <button className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700" onClick={() => edit(o)}>Edit</button>}{o.status === "CONFIRMED" && <button className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700" onClick={() => sendToKitchen(o)}>Send to kitchen</button>          }{o.status === "SERVED" && <button className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800" onClick={() => createBill(o)}>Create bill</button>}{nextStatus[o.status] && <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold" onClick={() => move(o, nextStatus[o.status])}>Advance</button>}{!["COMPLETED", "CANCELLED", "ARCHIVED"].includes(o.status) && <button className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700" onClick={() => move(o, "CANCELLED")}>Cancel</button>}</div></article>)}</div></section>
        </div>
      </section>
      <aside className={`fixed inset-x-0 bottom-0 z-30 flex h-[min(88dvh,680px)] flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl min-[1000px]:static min-[1000px]:h-auto min-[1000px]:rounded-none min-[1000px]:border-y-0 min-[1000px]:border-l min-[1000px]:shadow-[-4px_0_18px_rgba(15,23,42,.04)] ${cartOpen ? "max-[999px]:flex" : "max-[999px]:hidden"}`}><div className="shrink-0 border-b border-slate-200 px-5 py-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Current order</h2><p className="text-xs text-slate-500">{Object.values(cart).reduce((n, i) => n + i.quantity, 0)} items · {type.replace("_", " ")}</p></div><button className="rounded-lg px-2 py-1 text-xl text-slate-400 min-[1000px]:hidden" aria-label="Close cart" onClick={() => setCartOpen(false)}>×</button><span className="hidden rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase min-[1000px]:inline">{editing ? editing.orderNumber : "Draft"}</span></div></div><div className="min-h-0 flex-1 overflow-y-auto px-5">{!Object.keys(cart).length ? <div className="grid h-48 place-items-center text-center text-sm text-slate-400"><div><div className="mb-2 text-3xl">🛒</div><p>Your order is empty</p><p className="text-xs">Add items from the menu</p></div></div> : Object.entries(cart).map(([key, item]) => <div className="border-b border-slate-100 py-4" key={key}><div className="flex justify-between gap-3"><div><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-slate-500">{item.variantName}</p></div><b className="text-sm">{money(item.price * item.quantity)}</b></div><div className="mt-3 flex items-center gap-2"><button className="grid h-8 w-8 place-items-center rounded-lg border text-sm" onClick={() => change(key, item.quantity - 1)}>−</button><span className="w-5 text-center text-sm font-bold">{item.quantity}</span><button className="grid h-8 w-8 place-items-center rounded-lg border text-sm" onClick={() => change(key, item.quantity + 1)}>+</button><button className="ml-auto text-xs font-semibold text-red-500" onClick={() => change(key, 0)}>Remove</button></div><input className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs" placeholder="Add a note" value={item.notes} onChange={e => setCart(c => ({ ...c, [key]: { ...c[key], notes: e.target.value } }))} /></div>)}<div className="grid grid-cols-2 gap-2 py-4">{[["discount", "Discount"], ["tax", "Tax"], ["serviceCharge", "Service"], ["deliveryCharge", "Delivery"]].map(([key, label]) => <label key={key} className="text-[10px] font-semibold text-slate-500">{label}<input type="number" min="0" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs" value={(customer as any)[key]} onChange={e => setCustomerValue(key as keyof Customer, e.target.value)} /></label>)}</div></div><div className="shrink-0 border-t border-slate-200 bg-white px-5 py-3"><div className="space-y-1 text-xs text-slate-500"><div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between"><span>Adjustments</span><span>{money(Number(customer.discount || 0) * -1 + Number(customer.tax || 0) + Number(customer.serviceCharge || 0) + Number(customer.deliveryCharge || 0))}</span></div><div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{money(total)}</span></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={newOrder} className="rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button onClick={submit} className="rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-600">{editing ? "Save changes" : "Place order"} <span className="ml-1">→</span></button></div></div></aside>
    </div>
    <button onClick={() => setCartOpen(true)} className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3.5 text-left text-white shadow-xl min-[1000px]:hidden"><span><span className="block text-xs text-slate-300">Current order · {Object.values(cart).reduce((n, i) => n + i.quantity, 0)} items</span><b className="text-base">{money(total)}</b></span><span className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold">View Cart</span></button>
    {cartOpen && <button aria-label="Close cart overlay" onClick={() => setCartOpen(false)} className="fixed inset-0 z-20 bg-slate-950/40 min-[1000px]:hidden" />}
    {variantItem && <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">Choose a variant</h2><p className="mb-4 text-sm text-slate-500">{variantItem.name}</p><div className="space-y-2">{variantItem.variants.map((v: any) => <button key={v.id} onClick={() => add(variantItem, v)} className="flex w-full justify-between rounded-xl border border-slate-200 p-3 text-left text-sm hover:border-blue-500"><span>{v.name}</span><b>{money(v.price)}</b></button>)}</div><button className="mt-4 w-full rounded-xl border p-2.5 text-sm" onClick={() => setVariantItem(null)}>Cancel</button></div></div>}
    {confirmation && <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><p className="font-bold text-emerald-600">✓ Order placed successfully</p><h2 className="mt-1 text-2xl font-bold">{confirmation.orderNumber}</h2><p className="my-3 text-sm text-slate-600">{confirmation.items.map((i: any) => `${i.itemName} ×${i.quantity}`).join(", ")}</p><p className="text-xl font-bold">Total: {money(confirmation.total)}</p><div className="mt-5 flex gap-2"><button className="flex-1 rounded-xl bg-blue-600 p-3 text-sm font-bold text-white" onClick={() => { setSelectedOrder(confirmation); setConfirmation(null); }}>View order</button><button className="flex-1 rounded-xl border p-3 text-sm" onClick={() => setConfirmation(null)}>New order</button></div></div></div>}
    {selectedOrder && <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/50 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between"><div><h2 className="text-2xl font-bold">{selectedOrder.orderNumber}</h2><p className="text-sm text-slate-500">{selectedOrder.orderType.replace("_", " ")} · {selectedOrder.status}</p></div><button onClick={() => setSelectedOrder(null)} aria-label="Close" className="text-xl text-slate-400">×</button></div><div className="my-5 space-y-3">{selectedOrder.items.map((i: any) => <div className="flex justify-between border-b pb-3 text-sm" key={i.id || `${i.menuItemId}:${i.menuVariantId}`}><span>{i.itemName} · {i.variantName || "Standard"} ×{i.quantity}{i.notes && <small className="block text-slate-500">Note: {i.notes}</small>}</span><span>{money(Number(i.unitPrice) * i.quantity)}</span></div>)}</div><p className="text-sm">Subtotal: {money(selectedOrder.subtotal)}</p><p className="mt-1 text-xl font-bold">Grand total: {money(selectedOrder.total)}</p>{selectedOrder.customerAddress && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">Delivery: {selectedOrder.customerAddress}<br />{selectedOrder.notes}</p>}</div></div>}
  </main>;
}
