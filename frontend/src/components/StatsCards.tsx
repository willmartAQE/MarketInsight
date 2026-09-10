"use client";

import { Stats } from "@/types";
import { DollarSign, Package, TrendingUp, Star, Sparkles, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardsProps {
  stats: Stats | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null;

  const cards = [
    {
      label: "Total Products",
      value: stats.total_products.toLocaleString(),
      subtitle: "Live tracked across stores",
      icon: Package,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgGradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
      borderColor: "border-blue-200/80 hover:border-blue-400/80",
      badge: "+100% Verified PDP",
      badgeStyle: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      label: "Average Price",
      value: `$${stats.avg_price.toFixed(2)}`,
      subtitle: "Across active catalog",
      icon: DollarSign,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      borderColor: "border-emerald-200/80 hover:border-emerald-400/80",
      badge: "Real-time Index",
      badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      label: "Price Spread",
      value: `$${stats.min_price.toFixed(0)} - $${stats.max_price.toFixed(0)}`,
      subtitle: "Min to Max market delta",
      icon: TrendingUp,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgGradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
      borderColor: "border-purple-200/80 hover:border-purple-400/80",
      badge: "Cross-Market Spread",
      badgeStyle: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      label: "Average Rating",
      value: stats.avg_rating > 0 ? `${stats.avg_rating.toFixed(1)} / 5.0` : "N/A",
      subtitle: "Consumer sentiment score",
      icon: Star,
      iconColor: "text-amber-500 dark:text-amber-400",
      bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      borderColor: "border-amber-200/80 hover:border-amber-400/80",
      badge: "High Satisfaction",
      badgeStyle: "bg-amber-50 text-amber-700 border-amber-200"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.08, ease: "easeOut" }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`relative overflow-hidden rounded-2xl border ${card.borderColor} bg-white/90 backdrop-blur-md p-5 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-default`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br ${card.bgGradient} blur-2xl group-hover:scale-150 transition-transform duration-500`} />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${card.badgeStyle}`}>
                {card.badge}
              </span>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{card.value}</h3>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{card.subtitle}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
