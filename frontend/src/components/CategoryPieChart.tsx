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
  "#d4af37",
  "#2dd4bf",
  "#e5c07b",
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#fb923c",
  "#4ade80",
];

export function CategoryPieChart({ stats }: CategoryPieChartProps) {
  if (!stats || stats.categories.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-6 shadow-2xl">
        <h3 className="font-display text-lg font-semibold text-[#f8fafc] mb-4">Products by Category</h3>
        <p className="font-mono text-xs text-slate-500 text-center py-8">No data available</p>
      </div>
    );
  }

  const data = stats.categories.slice(0, 10).map((c) => ({
    name: c.name,
    value: c.count,
  }));

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111318] p-6 shadow-2xl">
      <h3 className="font-display text-lg font-semibold text-[#f8fafc] mb-4">Products by Category</h3>
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
              backgroundColor: "#181b22",
              borderRadius: "8px",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              color: "#f8fafc",
              fontFamily: "JetBrains Mono",
              fontSize: "12px",
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              fontFamily: "Outfit",
              color: "#94a3b8",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
