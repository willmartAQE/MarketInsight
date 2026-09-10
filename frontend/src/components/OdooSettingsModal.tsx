"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertCircle, RefreshCw, Layers, Database, Lock, User, Link, Send } from "lucide-react";
import { Product } from "@/types";

interface OdooSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts?: Product[];
}

export function OdooSettingsModal({ isOpen, onClose, selectedProducts = [] }: OdooSettingsModalProps) {
  const [url, setUrl] = useState("");
  const [db, setDb] = useState("");
  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [autoSync, setAutoSync] = useState(false);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; summary?: { total: number; successCount: number; failCount: number }; error?: string } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch(`${API_BASE}/api/odoo/config`);
      const data = await res.json();
      if (data.success && data.config) {
        setUrl(data.config.url || "");
        setDb(data.config.db || "");
        setUsername(data.config.username || "");
        setApiKey(data.config.apiKey || "");
        setAutoSync(Boolean(data.config.autoSync));
      }
    } catch {
      // ignore
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await fetch(`${API_BASE}/api/odoo/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, db, username, apiKey, autoSync }),
      });
    } catch {
      // ignore
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    await handleSaveConfig();

    try {
      const res = await fetch(`${API_BASE}/api/odoo/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, db, username, apiKey }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || "Failed to reach server" });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncSelected = async () => {
    setSyncing(true);
    setSyncResult(null);
    await handleSaveConfig();

    const productIds = selectedProducts.map((p) => p.id);

    try {
      const res = await fetch(`${API_BASE}/api/odoo/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: productIds.length > 0 ? productIds : undefined,
          credentials: { url, db, username, apiKey },
        }),
      });
      const data = await res.json();
      setSyncResult(data);
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message || "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold shadow-sm">
              <Layers className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Connettore Odoo ERP
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                  Community / Free
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Sincronizza le opportunità di mercato direttamente nel tuo catalogo Vendite Odoo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Link className="h-3.5 w-3.5 text-slate-500" /> URL Server Odoo
            </label>
            <input
              type="text"
              placeholder="https://tua-azienda.odoo.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-slate-500" /> Database Name
              </label>
              <input
                type="text"
                placeholder="es. mia_azienda_db"
                value={db}
                onChange={(e) => setDb(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-500" /> Username / Email
              </label>
              <input
                type="email"
                placeholder="admin@azienda.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-500" /> API Key / Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Trovi la chiave API in Odoo: <i>Impostazioni → Utenti → Le mie credenziali → Chiavi API</i>.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoSync"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="autoSync" className="text-xs font-medium text-slate-700 cursor-pointer">
              Sincronizza automaticamente i nuovi prodotti ad alto rendimento estratti
            </label>
          </div>
        </div>

        {/* Feedback Section */}
        {testResult && (
          <div
            className={`mt-4 rounded-xl p-3.5 text-xs border flex items-start gap-2.5 ${
              testResult.success
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.success ? "Connessione riuscita!" : "Errore di connessione"}</p>
              <p className="mt-0.5">{testResult.message || testResult.error}</p>
            </div>
          </div>
        )}

        {syncResult && (
          <div
            className={`mt-4 rounded-xl p-3.5 text-xs border flex items-start gap-2.5 ${
              syncResult.success
                ? "bg-purple-50 text-purple-800 border-purple-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {syncResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {syncResult.success ? "Sincronizzazione Odoo completata!" : "Errore sincronizzazione"}
              </p>
              {syncResult.summary && (
                <p className="mt-0.5">
                  Prodotti elaborati: <strong>{syncResult.summary.total}</strong> (Sincronizzati:{" "}
                  <strong>{syncResult.summary.successCount}</strong>, Falliti: {syncResult.summary.failCount})
                </p>
              )}
              {syncResult.error && <p className="mt-0.5">{syncResult.error}</p>}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !url || !db || !username || !apiKey}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm"
          >
            {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Test Connessione
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={handleSyncSelected}
              disabled={syncing || !url || !db || !username || !apiKey}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-purple-500/20"
            >
              {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {selectedProducts.length > 0
                ? `Invia ${selectedProducts.length} Prodotti a Odoo`
                : "Sincronizza Catalogo in Odoo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
