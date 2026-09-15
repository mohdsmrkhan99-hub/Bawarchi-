import { getBillableOrders, getBills } from "./actions";
import BillingClient from "./billing-client";
export const dynamic = "force-dynamic";
export default async function BillingPage() { return <BillingClient initialBills={await getBills()} initialBillableOrders={await getBillableOrders()} />; }
