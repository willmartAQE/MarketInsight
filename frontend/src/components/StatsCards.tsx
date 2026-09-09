"use client";

import { Stats } from "@/types";
import { DollarSign, Package, TrendingUp, Star } from "lucide-react";

interface StatsCardsProps {
  stats: Stats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null;

  const cards = [
    {
      label: "Total Products",
      value: stats.total_products.toLocaleString(),
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Average Price",
      value: `$${stats.avg_price.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Price Range",
      value: `$${stats.min_price.toFixed(0)} - $${stats.max_price.toFixed(0)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Avg Rating",
      value: stats.avg_rating > 0 ? `${stats.avg_rating.toFixed(1)} / 5` : "N/A",
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className={`${card.bg} rounded-lg p-3`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
