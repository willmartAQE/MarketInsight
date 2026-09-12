"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Product } from "@/types";

interface TopProductsChartProps {
  products: Product[];
}

const COLORS = [
  "#d4af37",
  "#2dd4bf",
  "#e5c07b",
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#fb923c",
  "#4ade80",
];

export function TopProductsChart({ products }: TopProductsChartProps) {
  const data = products.slice(0, 10).map((p) => ({
    name: p.name.length > 25 ? p.name.slice(0, 25) + "..." : p.name,
    reviews: p.reviews_count || 0,
    price: p.price,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-6 shadow-2xl">
        <h3 className="font-display text-lg font-semibold text-[#f8fafc] mb-4">Top Products by Reviews</h3>
        <p className="font-mono text-xs text-slate-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-6 shadow-2xl">
      <h3 className="font-display text-lg font-semibold text-[#f8fafc] mb-4">Top Products by Reviews</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2430" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "JetBrains Mono" }} />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={{ fontSize: 11, fill: "#cbd5e1", fontFamily: "Outfit" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#181b22",
              borderRadius: "8px",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              color: "#f8fafc",
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
            }}
            formatter={(value: any) => [String(value), "Reviews"]}
          />
          <Bar dataKey="reviews" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
