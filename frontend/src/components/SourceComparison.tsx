"use client";

import { Stats } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface SourceComparisonProps {
  stats: Stats | null;
}

const COLORS = [
  "#3b82f6", "#f97316", "#10b981", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#f59e0b", "#14b8a6", "#6366f1",
];

const SOURCE_LABELS: Record<string, string> = {
  "walmart": "Walmart",
  "amazon": "Amazon US",
  "amazon-de": "Amazon DE",
  "amazon-fr": "Amazon FR",
  "amazon-it": "Amazon IT",
  "amazon-es": "Amazon ES",
  "amazon-uk": "Amazon UK",
  "amazon-nl": "Amazon NL",
  "amazon-pl": "Amazon PL",
  "amazon-jp": "Amazon JP",
  "ebay-de": "eBay DE",
  "ebay-fr": "eBay FR",
  "ebay-it": "eBay IT",
  "ebay-es": "eBay ES",
  "target": "Target",
  "sephora": "Sephora US",
  "sephora-us": "Sephora US",
  "sephora-ca": "Sephora CA",
  "sephora-fr": "Sephora FR",
  "sephora-it": "Sephora IT",
  "sephora-de": "Sephora DE",
  "sephora-es": "Sephora ES",
  "sephora-uk": "Sephora UK",
  "sephora-pl": "Sephora PL",
  "lego": "LEGO",
  "interflora": "Interflora",
};

export function SourceComparison({ stats }: SourceComparisonProps) {
  if (!stats || stats.sources.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Source</h3>
        <p className="text-gray-400 text-center py-8">No data available</p>
      </div>
    );
  }

  const data = stats.sources.map((s) => ({
    name: SOURCE_LABELS[s.name] || s.name,
    count: s.count,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Source</h3>
      <ResponsiveContainer width="100%" height={Math.max(250, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
