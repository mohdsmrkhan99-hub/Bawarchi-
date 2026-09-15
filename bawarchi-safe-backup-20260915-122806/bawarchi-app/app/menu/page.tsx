import { getMenuManagementData } from "./actions";
import MenuClient from "./menu-client";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const data = await getMenuManagementData();
  return <MenuClient initialData={data} />;
}
