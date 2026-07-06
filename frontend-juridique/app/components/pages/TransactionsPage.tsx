"use client";

import { useState, useEffect } from "react";
import { Langue } from "@/app/types";
import { SERVICE_GROUPS, getRoleLabel } from "@/lib/constants";
import { exportRows, ExportFormat } from "@/lib/exportImport";

interface Props {
  langue: Langue;
  cur: any;
  token: string | null;
  BASE_URL: string;
  onAccepted?: () => void;
}

interface TransactionData {
  id: number;
  documentId: number;
  documentSujet: string;
  sourceServiceId: string;
  destinationServiceId: string;
  message: string;
  statut: string;
  dateEnvoi: string;
  doitRevenir: boolean;
  commentaire?: string;
  motifRefus?: string;
}

export function TransactionsPage({ langue, cur, token, BASE_URL, onAccepted }: Props) {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [commentaires, setCommentaires] = useState<Record<number, string>>({});
  const [retours, setRetours] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/Transactions/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTransactions(await res.json());
    } catch (err) {
      console.error("Erreur fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [token]);

  const pendingTransactions = transactions.filter(t => t.statut === "EnAttente");
  const acceptedTransactions = transactions.filter(t => t.statut === "Accepte");
  const refusedTransactions = transactions.filter(t => t.statut === "Refuse");

  const exportTransactions = (format: ExportFormat) => {
    const rows = transactions.map(t => ({
      [langue === "fr" ? "Document" : "الوثيقة"]: t.documentSujet,
      [langue === "fr" ? "De" : "من"]: getServiceLabel(t.sourceServiceId),
      [langue === "fr" ? "Vers" : "إلى"]: getServiceLabel(t.destinationServiceId),
      [langue === "fr" ? "Statut" : "الحالة"]: t.statut === "EnAttente" ? (langue === "fr" ? "En attente" : "في الانتظار") : t.statut === "Accepte" ? (langue === "fr" ? "Accepté" : "مقبول") : (langue === "fr" ? "Refusé" : "مرفوض"),
      [langue === "fr" ? "Message" : "رسالة"]: t.message || "",
      [langue === "fr" ? "Date" : "التاريخ"]: new Date(t.dateEnvoi).toLocaleDateString(),
    }));
    exportRows(rows, "transactions", format, cur.registreTransactions);
  };

  const getServiceLabel = (value: string) => {
    for (const group of SERVICE_GROUPS) {
      for (const child of group.children) {
        if (child.value === value) return langue === "fr" ? child.fr : child.ar;
      }
    }
    return getRoleLabel(value, langue);
  };

  const handleAccept = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Transactions/${id}/accepter`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ commentaire: commentaires[id] || "" }),
      });
      if (res.ok) {
        fetchTransactions();
        onAccepted?.();
      }
    } catch (err) { console.error(err); }
  };

  const handleRefuse = async (id: number) => {
    if (!token) return;
    const motif = commentaires[id] || "";
    if (!motif) {
      alert(langue === "fr" ? "Veuillez saisir un motif de refus" : "يرجى إدخال سبب الرفض");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/Transactions/${id}/refuser`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ commentaire: motif, doitRevenir: !!retours[id] }),
      });
      if (res.ok) {
        fetchTransactions();
        onAccepted?.();
      }
    } catch (err) { console.error(err); }
  };

  const getStatutBadge = (statut: string) => {
    if (statut === "EnAttente") {
      return (
        <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-bold text-[10px]">
          {langue === "fr" ? "En attente" : "في الانتظار"}
        </span>
      );
    }
    if (statut === "Accepte") {
      return (
        <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
          {langue === "fr" ? "Accepté" : "مقبول"}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-bold text-[10px]">
        {langue === "fr" ? "Refusé" : "مرفوض"}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-bold text-slate-600">
            {langue === "fr" ? "En attente" : "في الانتظار"}
          </span>
          <strong className="block text-2xl mt-2 text-amber-600">{pendingTransactions.length}</strong>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-bold text-slate-600">
            {langue === "fr" ? "Acceptées" : "المقبولات"}
          </span>
          <strong className="block text-2xl mt-2 text-emerald-600">{acceptedTransactions.length}</strong>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <span className="text-xs font-bold text-slate-600">
            {langue === "fr" ? "Refusées" : "المرفوضات"}
          </span>
          <strong className="block text-2xl mt-2 text-red-600">{refusedTransactions.length}</strong>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm">{cur.registreTransactions}</h3>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => exportTransactions("excel")}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100 transition"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => exportTransactions("word")}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 hover:bg-blue-100 transition"
            >
              Word
            </button>
            <button
              type="button"
              onClick={fetchTransactions}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              {langue === "fr" ? "Rafraîchir" : "تحديث"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold">
            {langue === "fr" ? "Chargement..." : "جاري التحميل..."}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold">
            {cur.aucunDoc}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3 text-start">{cur.tblTitre}</th>
                  <th className="p-3 text-start">{cur.tblRef}</th>
                  <th className="p-3 text-start">{langue === "fr" ? "De" : "من"}</th>
                  <th className="p-3 text-start">{langue === "fr" ? "Vers" : "إلى"}</th>
                  <th className="p-3 text-start">{cur.statut}</th>
                  <th className="p-3 text-start">{langue === "fr" ? "Message" : "رسالة"}</th>
                  <th className="p-3 text-start">{langue === "fr" ? "Date" : "التاريخ"}</th>
                  <th className="p-3 text-start">{langue === "fr" ? "Actions" : "إجراءات"}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-bold">{t.documentSujet}</td>
                    <td className="p-3 font-mono text-[10px]">{t.documentId}</td>
                    <td className="p-3">{getServiceLabel(t.sourceServiceId)}</td>
                    <td className="p-3">{getServiceLabel(t.destinationServiceId)}</td>
                    <td className="p-3">{getStatutBadge(t.statut)}</td>
                    <td className="p-3 max-w-[200px] truncate text-slate-500">{t.message || "-"}</td>
                    <td className="p-3 text-slate-500">{new Date(t.dateEnvoi).toLocaleDateString()}</td>
                    <td className="p-3">
                      {t.statut === "EnAttente" ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={commentaires[t.id] || ""}
                              onChange={(e) => setCommentaires(prev => ({ ...prev, [t.id]: e.target.value }))}
                              placeholder={langue === "fr" ? "Commentaire..." : "تعليق..."}
                              className="w-32 p-1.5 border border-slate-300 rounded text-[10px] outline-none focus:border-blue-500"
                            />
                            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 cursor-pointer whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={!!retours[t.id]}
                                onChange={(e) => setRetours(prev => ({ ...prev, [t.id]: e.target.checked }))}
                                className="w-3 h-3"
                              />
                              {langue === "fr" ? "Retour" : "مرجع"}
                            </label>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAccept(t.id)}
                              className="px-2.5 py-1.5 rounded bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition whitespace-nowrap"
                            >
                              {langue === "fr" ? "Accepter" : "قبول"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRefuse(t.id)}
                              className="px-2.5 py-1.5 rounded bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition whitespace-nowrap"
                            >
                              {langue === "fr" ? "Refuser" : "رفض"}
                            </button>
                          </div>
                        </div>
                      ) : t.statut === "Refuse" ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-red-500 italic">{t.motifRefus || "-"}</span>
                          {t.doitRevenir && (
                            <span className="text-[10px] text-amber-600 font-bold">
                              {langue === "fr" ? "↩ Retourné à l'expéditeur" : "↩ أُعيد للمرسل"}
                            </span>
                          )}
                        </div>
                      ) : t.commentaire ? (
                        <span className="text-[10px] text-emerald-600 italic">{t.commentaire}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
