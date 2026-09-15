import { getStaff } from "./actions";
import StaffClient from "./staff-client";
export const dynamic = "force-dynamic";
export default async function StaffPage() { return <StaffClient initialData={await getStaff()} />; }
