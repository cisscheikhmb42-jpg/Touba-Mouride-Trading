import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/config";
import type { StockState } from "@/lib/data/product-utils";

export function stockLabel(state: StockState, dict: Dictionary): string {
  switch (state.kind) {
    case "unavailable":
      return dict.product.unavailable;
    case "out_of_stock":
      return dict.product.outOfStock;
    case "low":
      return format(dict.product.lowStock, { n: state.quantity });
    case "in_stock":
      return dict.product.inStock;
    case "available":
      return dict.product.available;
  }
}

export function StockBadge({ state, dict }: { state: StockState; dict: Dictionary }) {
  const tone =
    state.kind === "unavailable" || state.kind === "out_of_stock"
      ? "bg-[#fdecea] text-danger"
      : state.kind === "low"
        ? "bg-[#fff4de] text-warning"
        : "bg-[#e7f5ec] text-success";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {stockLabel(state, dict)}
    </span>
  );
}
