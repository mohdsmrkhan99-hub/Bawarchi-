import {
  createFloor,
  createSection,
  createTable,
  deleteFloor,
  deleteSection,
  deleteTable,
  getTableManagementData,
  reorderFloor,
  setFloorActive,
  setSectionActive,
  setTableActive,
  updateFloor,
  updateSection,
  updateTable,
} from "@/app/tables/actions";
import { apiError, apiSuccess } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const data = await getTableManagementData();
    return apiSuccess(data ?? { name: "No active branch", floors: [] });
  } catch (error) {
    return apiError(error, request, "/api/tables");
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as { action?: string; [key: string]: unknown };
    switch (input.action ?? "create-table") {
      case "create-table":
        await createTable(input as never);
        break;
      case "update-table":
        await updateTable(input as never);
        break;
      case "set-table-active":
        await setTableActive(input as never);
        break;
      case "delete-table":
        await deleteTable(input as never);
        break;
      case "create-floor":
        await createFloor(input as never);
        break;
      case "update-floor":
        await updateFloor(input as never);
        break;
      case "set-floor-active":
        await setFloorActive(input as never);
        break;
      case "delete-floor":
        await deleteFloor(input as never);
        break;
      case "reorder-floor":
        await reorderFloor(input as never);
        break;
      case "create-section":
        await createSection(input as never);
        break;
      case "update-section":
        await updateSection(input as never);
        break;
      case "set-section-active":
        await setSectionActive(input as never);
        break;
      case "delete-section":
        await deleteSection(input as never);
        break;
      default:
        return apiError(new Error("Unknown table management action."), request, "/api/tables");
    }
    return apiSuccess({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error, request, "/api/tables");
  }
}
