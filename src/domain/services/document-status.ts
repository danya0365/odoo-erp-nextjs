// state-machine helper ทั่วไป (pure) — ใช้กับ sales/purchase/invoice status
// graph = map จากสถานะ → รายการสถานะถัดไปที่อนุญาต
export type TransitionGraph<S extends string> = Record<S, readonly S[]>;

export function canTransition<S extends string>(
  graph: TransitionGraph<S>,
  from: S,
  to: S,
): boolean {
  return graph[from]?.includes(to) ?? false;
}

export function assertTransition<S extends string>(
  graph: TransitionGraph<S>,
  from: S,
  to: S,
): void {
  if (!canTransition(graph, from, to)) {
    throw new Error(`เปลี่ยนสถานะไม่ได้: ${from} → ${to}`);
  }
}

// variant ของ Badge (ตรงกับ BadgeProps ใน UI) — map ไว้ที่ presentation
export type BadgeVariant = "neutral" | "brand" | "success" | "warning" | "error";
