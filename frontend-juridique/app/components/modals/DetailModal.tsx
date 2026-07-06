"use client";

import { useEffect, useState } from "react";
import { CourrierSimule } from "@/app/types";
import { SERVICE_GROUPS, getRoleLabel, WORKFLOW_STEPS, getWorkflowProgress, getDelayDays } from "@/lib/constants";

interface DetailModalProps {
  doc: CourrierSimule | null;
  onClose: () => void;
  historique: any[];
  cur: any;
  langue?: "fr" | "ar";
  token?: string | null;
  BASE_URL?: string;
}

interface HistoryEntry {
  id: number;
  serviceOrigine: string;
  serviceDestination: string;
  date: string;
  remarques: string;
  statut: string;
  commentaire: string;
  motifRefus: string;
  doitRevenir: boolean;
}

export function DetailModal({ doc, onClose, historique, cur, langue = "fr", token, BASE_URL }: DetailModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const getServiceLabel = (value: string) => {
    for (const group of SERVICE_GROUPS) {
      for (const child of group.children) {
        if (child.value === value) return langue === "fr" ? child.fr : child.ar;
      }
    }
    return getRoleLabel(value, langue);
  };

  const fetchHistory = async () => {
    if (!doc || !token || !BASE_URL) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${BASE_URL}/api/Transactions/history/${doc.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error("Erreur fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (doc) fetchHistory();
  }, [doc?.id, token]);

  if (!doc) return null;

  const getStatutBadge = (statut: string) => {
    if (statut === "EnAttente") return "bg-amber-100 text-amber-700";
    if (statut === "Accepte") return "bg-emerald-100 text-emerald-700";
    if (statut === "Refuse") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-600";
  };

  const getStatutLabel = (statut: string) => {
    if (statut === "EnAttente") return langue === "fr" ? "En attente" : "في الانتظار";
    if (statut === "Accepte") return langue === "fr" ? "Accepté" : "مقبول";
    if (statut === "Refuse") return langue === "fr" ? "Refusé" : "مرفوض";
    return statut;
  };

  const progress = getWorkflowProgress(doc.serviceActuelKey || doc.serviceActuel);
  const delayDays = getDelayDays(doc.date);
  const isLate = delayDays > 7;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{cur.modalTitre}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Progress Bar */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {langue === "fr" ? "Avancement du dossier" : "تقدم الملف"}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{progress.label}</span>
            </div>
            <div className="flex gap-1">
              {WORKFLOW_STEPS.map((step, i) => {
                const isActive = i < progress.step;
                const isCurrent = i === progress.step - 1;
                return (
                  <div key={i} className="flex-1">
                    <div className={`h-2 rounded-full ${isActive ? (isCurrent ? "bg-blue-500" : "bg-emerald-500") : "bg-slate-200 dark:bg-slate-600"}`}></div>
                    <p className={`text-[9px] mt-1 text-center ${isCurrent ? "text-blue-600 font-bold" : "text-slate-400"}`}>
                      {langue === "fr" ? step.labelFr : step.labelAr}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delay Alert */}
          {isLate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold text-red-700 dark:text-red-400">
                {langue === "fr" ? `En retard de ${delayDays} jours` : `متأخر بـ ${delayDays} يوم`}
              </span>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{cur.tblRef}</p>
              <p className="text-sm font-semibold dark:text-slate-200">{doc.reference}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{cur.tblDate}</p>
              <p className="text-sm dark:text-slate-200">{doc.date}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{cur.tblSource}</p>
              <p className="text-sm dark:text-slate-200">{doc.source}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{cur.serviceActuel}</p>
              <p className="text-sm dark:text-slate-200">{doc.serviceActuel}</p>
            </div>
            {doc.destinataireExterne && (
              <div className="col-span-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{cur.destinataireExterne}</p>
                <p className="text-sm dark:text-slate-200">{doc.destinataireExterne}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{cur.tblTitre}</p>
              <p className="text-sm dark:text-slate-200">{doc.objet}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{cur.statut}</p>
              <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700">
                {doc.statut}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
              {langue === "fr" ? "Chronologie des mouvements" : "الجدول الزمني للتنقلات"}
            </h4>
            {loadingHistory ? (
              <p className="text-xs text-slate-400">{langue === "fr" ? "Chargement..." : "جاري التحميل..."}</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                {langue === "fr" ? "Aucun mouvement enregistré" : "لا توجد تنقلات مسجلة"}
              </p>
            ) : (
              <div className="relative">
                <div className="absolute start-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-emerald-500 to-slate-200"></div>
                <div className="space-y-4">
                  {history.map((entry, index) => {
                    const isLast = index === history.length - 1;
                    return (
                      <div key={entry.id} className="relative ps-8">
                        <div className={`absolute start-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                          entry.statut === "Accepte" ? "bg-emerald-500" :
                          entry.statut === "Refuse" ? "bg-red-500" :
                          isLast ? "bg-blue-500 animate-pulse" :
                          "bg-amber-500"
                        }`}></div>
                        <div className={`p-3 rounded-lg border ${isLast ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700"}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                              {getServiceLabel(entry.serviceOrigine)} → {getServiceLabel(entry.serviceDestination)}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getStatutBadge(entry.statut)}`}>
                              {getStatutLabel(entry.statut)}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(entry.date).toLocaleString()}
                          </div>
                          {entry.remarques && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 italic">
                              {entry.remarques}
                            </div>
                          )}
                          {entry.commentaire && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                              {entry.commentaire}
                            </div>
                          )}
                          {entry.motifRefus && (
                            <div className="text-[10px] text-red-600 dark:text-red-400 mt-1">
                              {entry.motifRefus}
                              {entry.doitRevenir && (
                                <span className="ms-1 text-amber-600 font-bold">
                                  — {langue === "fr" ? "Retourné à l'expéditeur" : "أُعيد للمرسل"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-bold px-6 py-2 rounded-lg text-sm transition">
              {cur.fermer}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
