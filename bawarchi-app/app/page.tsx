"use client";

import { useState } from "react";

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

const statuses = ["Available", "Occupied", "Preparing", "Reserved"];

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [floor, setFloor] = useState("Ground Floor");
  const [tables, setTables] = useState(
    Array.from({ length: 48 }, (_, i) => ({
      id: i + 1,
      status: i === 1 || i === 4 ? "Occupied" : i === 6 ? "Reserved" : i === 3 || i === 9 ? "Preparing" : "Available",
    }))
  );

  const changeStatus = (id: number) => {
    setTables((old) =>
      old.map((t) => {
        if (t.id !== id) return t;
        const next = statuses[(statuses.indexOf(t.status) + 1) % statuses.length];
        return { ...t, status: next };
      })
    );
  };

  const statusClass = (status: string) => {
    if (status === "Occupied") return "bg-red-50 border-red-200 text-red-700";
    if (status === "Preparing") return "bg-orange-50 border-orange-200 text-orange-700";
    if (status === "Reserved") return "bg-blue-50 border-blue-200 text-blue-700";
    return "bg-green-50 border-green-200 text-green-700";
  };

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
                onClick={() => setActive(item)}
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
              onClick={() => setActive("Orders")}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              + New Order
            </button>
          </header>

          {active === "Dashboard" && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["Open Tables", tables.filter((t) => t.status === "Occupied").length],
                ["Active Orders", 18],
                ["Kitchen Queue", 9],
                ["Reservations", 7],
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
                  <button onClick={() => setActive("Orders")} className="rounded-xl border px-5 py-3">
                    Take Order
                  </button>
                  <button onClick={() => setActive("Kitchen")} className="rounded-xl border px-5 py-3">
                    Kitchen Queue
                  </button>
                  <button onClick={() => setActive("Menu")} className="rounded-xl border px-5 py-3">
                    Manage Menu
                  </button>
                </div>
              </div>
            </div>
          )}

          {active === "Tables" && (
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                {["Ground Floor", "First Floor", "Terrace"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFloor(f)}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                      floor === f ? "bg-slate-900 text-white" : "bg-white border"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{floor}</h3>
                    <p className="text-sm text-slate-500">48 tables configured</p>
                  </div>
                  <button
                    onClick={() => setTables(tables.map((t) => ({ ...t, status: "Available" })))}
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    Reset Status
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => changeStatus(table.id)}
                      className={`rounded-2xl border p-4 text-center transition hover:scale-105 ${statusClass(table.status)}`}
                    >
                      <div className="text-lg font-bold">T{table.id}</div>
                      <div className="mt-1 text-xs">{table.status}</div>
                    </button>
                  ))}
                </div>

                <p className="mt-5 text-xs text-slate-500">
                  Tap any table to cycle its operational status.
                </p>
              </div>
            </div>
          )}

          {active !== "Dashboard" && active !== "Tables" && (
            <div className="rounded-2xl border bg-white p-10 text-center">
              <div className="text-5xl">🚧</div>
              <h3 className="mt-4 text-2xl font-bold">{active} module</h3>
              <p className="mt-2 text-slate-500">
                This module is next in the build. Navigation is now working.
              </p>
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
