"use client";

import { useState } from "react";
import { Bot, X, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { startAIScrape } from "@/lib/api";

interface AIScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AIScrapeModal({ isOpen, onClose, onSuccess }: AIScrapeModalProps) {
  const [url, setUrl] = useState("");
  const [model, setModel] = useState("ollama/llama3.2");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResultMessage(null);
    setIsError(false);

    try {
      const res = await startAIScrape(url.trim(), model, customPrompt.trim() || undefined);
      if (res.status === "success") {
        setResultMessage("Estrazione AI completata con successo! Prodotti salvati nel database.");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setIsError(true);
        setResultMessage(res.error || "Estrazione fallita. Verifica l'URL o il modello Ollama.");
      }
    } catch (err: any) {
      setIsError(true);
      setResultMessage(err.message || "Errore di connessione con il backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-purple-700 font-semibold text-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
            ScrapeGraphAI + Ollama Locale
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              URL Pagina Web / Marketplace
            </label>
            <input
              type="url"
              required
              placeholder="https://www.homedepot.com/b/Tools/N-5yc1vZc258"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Modello Ollama Locale
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            >
              <option value="ollama/llama3.2">ollama/llama3.2 (Raccomandato - 3B)</option>
              <option value="ollama/llama3.1:8b">ollama/llama3.1:8b (8B)</option>
              <option value="ollama/mistral:7b">ollama/mistral:7b (7B)</option>
              <option value="ollama/qwen2.5-coder">ollama/qwen2.5-coder (Coder 7B)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Prompt Estrazione Personalizzato (Opzionale)
            </label>
            <textarea
              rows={2}
              placeholder="Estrai nome, prezzo, rating e link diretto dei prodotti..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
            />
          </div>

          {resultMessage && (
            <div
              className={`rounded-lg p-3 text-xs flex items-center gap-2 ${
                isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {isError ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              )}
              <span>{resultMessage}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Elaborazione Ollama in corso...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Estrai con AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
