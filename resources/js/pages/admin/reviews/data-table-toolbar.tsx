import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReviewRow } from "./columns";

type RatingFilter = 5 | 4 | 3 | "lte2" | null;

const RATING_TABS: { key: RatingFilter; label: string }[] = [
  { key: null, label: "All" },
  { key: 5, label: "5★" },
  { key: 4, label: "4★" },
  { key: 3, label: "3★" },
  { key: "lte2", label: "≤2★" },
];

export function ReviewsToolbar({ table }: { table: Table<ReviewRow> }) {
  const ratingFilter =
    (table.getColumn("rating")?.getFilterValue() as RatingFilter) ?? null;
  const [search, setSearch] = useState("");

  function handleSearch(value: string) {
    setSearch(value);
    table.getColumn("reviewer_name")?.setFilterValue(value);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {RATING_TABS.map((tab) => (
          <Button
            key={tab.key ?? "all"}
            size="sm"
            variant={ratingFilter === tab.key ? "default" : "secondary"}
            className="rounded-full"
            onClick={() =>
              table.getColumn("rating")?.setFilterValue(tab.key ?? undefined)
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Input
        placeholder="Search by customer…"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-64"
      />
    </div>
  );
}
