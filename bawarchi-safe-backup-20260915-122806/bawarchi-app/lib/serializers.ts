/**
 * Money crosses the server/client boundary as a decimal string.
 * Keeping the database precision in the transport type avoids binary floating
 * point rounding while allowing the UI to format values as needed.
 */
export type Money = string;

/**
 * Converts values returned by Prisma into values safe for JSON and Client Components.
 * Undefined object properties are omitted and undefined array entries become null.
 */
export function serializeData<T>(value: T): T {
  if (value instanceof Date) return value.toISOString() as T;
  if (value === undefined) return undefined as T;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(item => serializeData(item) ?? null) as T;
  if (value.constructor?.name === "Decimal" && typeof (value as { toString?: unknown }).toString === "function") {
    return (value as { toString(): string }).toString() as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (child !== undefined) result[key] = serializeData(child);
  }
  return result as T;
}

export function serializeMoney(value: { toString(): string } | number | string | null | undefined): Money {
  if (value == null) return "0.00";
  if (typeof value === "number") return value.toFixed(2);
  const raw = value.toString().trim();
  const [whole = "0", fraction = ""] = raw.split(".");
  return `${whole || "0"}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

export function serializeMenu(menu: Array<{
  items: Array<{ variants: Array<{ price: { toString(): string } | number | string }> }>;
}>) {
  return menu.map(category => ({
    ...category,
    items: category.items.map(item => ({
      ...item,
      variants: item.variants.map(variant => ({ ...variant, price: serializeMoney(variant.price) })),
    })),
  }));
}

export function serializeOrder(order: {
  subtotal: { toString(): string } | number | string;
  discount: { toString(): string } | number | string;
  tax: { toString(): string } | number | string;
  serviceCharge: { toString(): string } | number | string;
  deliveryCharge: { toString(): string } | number | string;
  total: { toString(): string } | number | string;
  items: Array<{
    unitPrice: { toString(): string } | number | string;
    lineTotal: { toString(): string } | number | string;
  }>;
}) {
  return {
    ...order,
    subtotal: serializeMoney(order.subtotal),
    discount: serializeMoney(order.discount),
    tax: serializeMoney(order.tax),
    serviceCharge: serializeMoney(order.serviceCharge),
    deliveryCharge: serializeMoney(order.deliveryCharge),
    total: serializeMoney(order.total),
    items: order.items.map(item => ({
      ...item,
      unitPrice: serializeMoney(item.unitPrice),
      lineTotal: serializeMoney(item.lineTotal),
    })),
  };
}
