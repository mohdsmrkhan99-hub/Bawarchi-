import { getReports } from "./actions";
import ReportsClient from "./reports-client";
export const dynamic = "force-dynamic";
export default async function ReportsPage() { return <ReportsClient report={await getReports()} />; }
