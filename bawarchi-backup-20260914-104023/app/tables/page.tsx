import { getTableManagementData } from "./actions";
import TablesClient from "./tables-client";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const data = await getTableManagementData();
  return <TablesClient branchName={data?.name ?? "No active branch"} floors={data?.floors ?? []} />;
}
