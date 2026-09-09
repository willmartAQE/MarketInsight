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
import { Stats } from "@/types";

interface PriceDistributionProps {
  stats: Stats | null;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function PriceDistribution({ stats }: PriceDistributionProps) {
  if (!stats || stats.price_ranges.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Distribution</h3>
        <p className="text-gray-400 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={stats.price_ranges} margin={{ left: 10, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {stats.price_ranges.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
