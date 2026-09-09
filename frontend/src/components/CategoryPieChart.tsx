"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Stats } from "@/types";

interface CategoryPieChartProps {
  stats: Stats | null;
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

export function CategoryPieChart({ stats }: CategoryPieChartProps) {
  if (!stats || stats.categories.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
        <p className="text-gray-400 text-center py-8">No data available</p>
      </div>
    );
  }

  const data = stats.categories.slice(0, 10).map((c) => ({
    name: c.name,
    value: c.count,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }: any) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
