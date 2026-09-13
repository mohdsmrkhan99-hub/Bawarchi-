export default function TablesPage() {
  const tables = Array.from({ length: 48 }, (_, i) => ({
    number: i + 1,
    status: i % 7 === 0 ? "Reserved" : i % 4 === 0 ? "Occupied" : "Available",
  }));

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Tables</h1>
      <p className="mt-1 text-slate-500">
        Manage restaurant tables and seating
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {tables.map((table) => (
          <button
            key={table.number}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="text-xl font-bold">T{table.number}</div>
            <div
              className={`mt-2 text-sm font-medium ${
                table.status === "Available"
                  ? "text-green-600"
                  : table.status === "Occupied"
                    ? "text-red-600"
                    : "text-blue-600"
              }`}
            >
              {table.status}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
