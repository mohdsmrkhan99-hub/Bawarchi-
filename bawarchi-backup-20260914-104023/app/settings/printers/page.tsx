import { getPrinters } from "@/app/billing/actions";
import PrintersClient from "./printers-client";
export const dynamic = "force-dynamic";
export default async function PrintersPage() { return <PrintersClient initialPrinters={await getPrinters()} />; }
