import { formatFCFA } from "@/lib/format";

export function Price({
  amount,
  compareAt,
  from = false,
  labels,
  size = "md",
}: {
  amount: number | null;
  compareAt?: number | null;
  from?: boolean;
  labels: { toConfirm: string; compareAt: string; from?: string };
  size?: "md" | "lg";
}) {
  if (amount === null) {
    return (
      <span className={`font-semibold text-gold-deep ${size === "lg" ? "text-lg" : "text-sm"}`}>{labels.toConfirm}</span>
    );
  }
  return (
    <span className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-display font-extrabold text-ink ${size === "lg" ? "text-3xl" : "text-base"}`}>
        {from && labels.from ? `${labels.from} ` : ""}
        {formatFCFA(amount)}
      </span>
      {compareAt && compareAt > amount ? (
        <span className="text-sm text-muted line-through">
          <span className="sr-only">{labels.compareAt} : </span>
          {formatFCFA(compareAt)}
        </span>
      ) : null}
    </span>
  );
}
