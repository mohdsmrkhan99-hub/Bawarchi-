import KitchenClient from "./kitchen-client";
import { getKitchenData } from "@/app/orders/actions";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  return <KitchenClient initialKots={await getKitchenData()} />;
}
