import { getOrderData } from "./actions";
import OrdersClient from "./orders-client";
export const dynamic = "force-dynamic";
export default async function OrdersPage() { return <OrdersClient initialData={await getOrderData()} />; }
