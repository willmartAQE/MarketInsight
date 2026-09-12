"use client";

import { Stats } from "@/types";
import { DollarSign, Package, TrendingUp, Star } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  stats: Stats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null;

  const cards = [
    {
      label: "TOTAL CATALOG",
      value: stats.total_products.toLocaleString(),
      subtitle: "Live PDP products tracked",
      icon: Package,
      badge: "VERIFIED PDP",
      accentColor: "text-[#d4af37]",
      borderColor: "border-[rgba(212,175,55,0.3)]",
    },
    {
      label: "AVERAGE PRICE",
      value: `$${stats.avg_price.toFixed(2)}`,
      subtitle: "Catalog mean index",
      icon: DollarSign,
      badge: "REAL-TIME INDEX",
      accentColor: "text-[#2dd4bf]",
      borderColor: "border-[rgba(45,212,191,0.3)]",
    },
    {
      label: "PRICE SPREAD",
      value: `$${stats.min_price.toFixed(0)} — $${stats.max_price.toFixed(0)}`,
      subtitle: "Min to Max market delta",
      icon: TrendingUp,
      badge: "ARBITRAGE DELTA",
      accentColor: "text-[#d4af37]",
      borderColor: "border-[rgba(212,175,55,0.3)]",
    },
    {
      label: "CONSUMER RATING",
      value: stats.avg_rating > 0 ? `${stats.avg_rating.toFixed(1)} / 5.0` : "N/A",
      subtitle: "Market sentiment score",
      icon: Star,
      badge: "HIGH SATISFACTION",
      accentColor: "text-[#e5c07b]",
      borderColor: "border-[rgba(229,192,123,0.3)]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.06 }}
          className={`relative rounded-xl border ${card.borderColor} bg-[#111318] p-5 shadow-xl transition-all duration-200 hover:border-[#d4af37]/60 group`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] tracking-[0.18em] font-semibold text-[#d4af37] uppercase bg-[#181b22] px-2 py-0.5 rounded border border-[rgba(212,175,55,0.2)]">
              {card.badge}
            </span>
            <div className="p-2 rounded-lg bg-[#181b22] border border-slate-800 text-slate-400 group-hover:text-[#d4af37] transition-colors">
              <card.icon className="h-4 w-4" />
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] font-medium text-slate-400 tracking-wider uppercase">{card.label}</p>
            <h3 className="font-display text-3xl font-semibold text-[#f8fafc] tracking-tight mt-1">{card.value}</h3>
            <p className="text-[11px] text-slate-500 font-sans mt-1">{card.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
