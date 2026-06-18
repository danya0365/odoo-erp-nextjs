// กราฟแท่งง่าย ๆ ด้วย CSS (ไม่มี dependency) — ค่าเป็น minor units, label เดือน
import { formatScaled } from "@/src/domain/services/money";

export interface BarDatum {
  label: string;
  value: number;
}

export function BarChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3" style={{ height: 180 }}>
      {data.map((d) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-brand-500 transition-all"
                style={{ height: `${pct}%`, minHeight: d.value > 0 ? 4 : 0 }}
                title={`฿${formatScaled(d.value, 100)}`}
              />
            </div>
            <span className="text-xs text-muted">{d.label.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}
