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
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

export function TopProductsChart({ products }: TopProductsChartProps) {
  const data = products.slice(0, 10).map((p) => ({
    name: p.name.length > 25 ? p.name.slice(0, 25) + "..." : p.name,
    reviews: p.reviews_count || 0,
    price: p.price,
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Reviews</h3>
        <p className="text-gray-400 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products by Reviews</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
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
