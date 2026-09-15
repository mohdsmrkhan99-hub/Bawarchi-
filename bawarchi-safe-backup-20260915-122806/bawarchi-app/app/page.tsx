"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DatabaseTablesView from "./tables/database-view";

const menu = [
  "Dashboard",
  "Tables",
  "Orders",
  "Kitchen",
  "Reservations",
  "Menu",
  "Customers",
  "Staff",
  "Reports",
  "Settings",
];

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const router = useRouter();
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-60 border-r bg-white p-5">
          <h1 className="text-xl font-bold">New Bawarchi</h1>
          <p className="mb-8 text-xs text-slate-500">Restaurant Operations System</p>

          <nav className="space-y-1">
            {menu.map((item) => (
              <button
                key={item}
                onClick={() => item === "Menu" ? router.push("/menu") : item === "Orders" ? router.push("/orders") : item === "Kitchen" ? router.push("/kitchen") : item === "Reservations" ? router.push("/reservations") : item === "Staff" ? router.push("/staff") : item === "Reports" ? router.push("/reports") : item === "Settings" ? router.push("/settings") : setActive(item)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium ${
                  active === item
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="font-semibold">● All systems online</div>
            <div className="mt-1 text-xs text-slate-500">Main Branch</div>
          </div>
        </aside>

        <section className="flex-1 p-6 md:p-10">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">New Bawarchi Family Restaurant</p>
              <h2 className="text-3xl font-bold">{active}</h2>
            </div>

            <button
              onClick={() => router.push("/orders")}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              + New Order
            </button>
          </header>

          {active === "Dashboard" && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["Open Tables", "—"],
                ["Active Orders", "—"],
                ["Kitchen Queue", "—"],
                ["Reservations", "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-3 text-4xl font-bold">{value}</p>
                </div>
              ))}

              <div className="rounded-2xl border bg-white p-6 md:col-span-2 lg:col-span-4">
                <h3 className="text-lg font-bold">Quick Actions</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => setActive("Tables")} className="rounded-xl border px-5 py-3">
                    Manage Tables
                  </button>
                  <button onClick={() => router.push("/orders")} className="rounded-xl border px-5 py-3">
                    Take Order
                  </button>
                  <button onClick={() => router.push("/kitchen")} className="rounded-xl border px-5 py-3">
                    Kitchen Queue
                  </button>
                  <button onClick={() => router.push("/menu")} className="rounded-xl border px-5 py-3">
                    Manage Menu
                  </button>
                </div>
              </div>
            </div>
          )}

          {active === "Tables" && <DatabaseTablesView />}

          {active !== "Dashboard" && active !== "Tables" && (
            <div className="rounded-2xl border bg-white p-10 text-center">
              <div className="text-5xl">→</div>
              <h3 className="mt-4 text-2xl font-bold">{active} module</h3>
              <p className="mt-2 text-slate-500">Open the operational module to view database-backed records.</p>
              <button
                onClick={() => setActive("Tables")}
                className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Open Tables
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
