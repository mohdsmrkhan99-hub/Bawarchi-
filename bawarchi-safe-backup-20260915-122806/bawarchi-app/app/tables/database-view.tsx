"use client";

import { useEffect, useState } from "react";
import TablesClient from "./tables-client";

type TableManagementData = Parameters<typeof TablesClient>[0];

export default function DatabaseTablesView() {
  const [data, setData] = useState<TableManagementData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tables", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load tables.");
        return response.json() as Promise<{ data: { name: string; floors: TableManagementData["floors"] } }>;
      })
      .then((result) => setData({ branchName: result.data.name, floors: result.data.floors }))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load tables."));
  }, []);

  if (error) return <div className="rounded-2xl border bg-white p-10 text-center text-sm text-red-600">{error}</div>;
  if (!data) return <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Loading tables from PostgreSQL...</div>;
  return <TablesClient {...data} />;
}
