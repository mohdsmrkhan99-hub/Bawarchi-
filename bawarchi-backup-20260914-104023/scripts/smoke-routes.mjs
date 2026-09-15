const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const routes = [
  ["/", "New Bawarchi"],
  ["/tables", "Restaurant Layout"],
  ["/menu", "Menu"],
  ["/orders", "DINE_IN"],
  ["/kitchen", "Kitchen Display"],
  ["/billing", "Billing & Receipts"],
  ["/reports", "Reports"],
  ["/reservations", "Reservations"],
  ["/staff", "Staff"],
  ["/settings", "Settings"],
];

for (const [route, marker] of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  const body = await response.text();
  if (!response.ok) throw new Error(`${route} returned HTTP ${response.status}`);
  if (!body.includes("<main") || !body.includes(marker)) {
    throw new Error(`${route} did not render its expected application shell`);
  }
  if (body.includes("Application error: a server-side exception")) {
    throw new Error(`${route} rendered a fatal Next.js application error`);
  }
  console.log(`PASS ${route} (${response.status})`);
}

const health = await fetch(`${baseUrl}/api/health`);
const healthBody = await health.json();
if (!health.ok || healthBody.success !== true || healthBody.data?.database !== "ok") {
  throw new Error(`/api/health failed: HTTP ${health.status}`);
}
console.log("PASS /api/health (database ok)");
