"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Product } from "@/types";
import { getProducts } from "@/lib/api";
import { CurrencyMode } from "@/lib/currency";
import { ProductComparison } from "@/components/ProductComparison";
import { Loader2 } from "lucide-react";

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("local");

  useEffect(() => {
    async function loadSelectedProducts() {
      setLoading(true);
      try {
        const idsParam = searchParams.get("ids");
        let targetIds: number[] = [];

        if (idsParam) {
          targetIds = idsParam.split(",").map((id) => Number(id.trim())).filter((id) => !isNaN(id) && id > 0);
        } else {
          // Fallback to localStorage if no URL query params
          const saved = localStorage.getItem("selectedProductIds");
          if (saved) {
            try {
              targetIds = JSON.parse(saved);
            } catch (e) {
              console.error("Failed to parse saved product IDs:", e);
            }
          }
        }

        if (targetIds.length > 0) {
          const allProducts = await getProducts();
          const filtered = allProducts.filter((p) => targetIds.includes(p.id));
          setProducts(filtered);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Failed to fetch comparison products:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSelectedProducts();
  }, [searchParams]);

  const handleRemoveProduct = (id: number) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);

    const updatedIds = updated.map((p) => p.id);
    localStorage.setItem("selectedProductIds", JSON.stringify(updatedIds));

    if (updatedIds.length === 0) {
      router.push("/");
    } else {
      router.replace(`/compare?ids=${updatedIds.join(",")}`);
    }
  };

  const handleClearAll = () => {
    setProducts([]);
    localStorage.removeItem("selectedProductIds");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 font-medium">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span>Loading comparison matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <ProductComparison
      products={products}
      onRemoveProduct={handleRemoveProduct}
      onClearAll={handleClearAll}
      onBack={() => router.push("/")}
      currencyMode={currencyMode}
    />
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-600 font-medium">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Loading page...</span>
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
