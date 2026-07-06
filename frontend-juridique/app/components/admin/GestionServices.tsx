"use client";

import { useState, useEffect } from "react";
import { Langue, ServiceItem } from "@/app/types";
import { ExportFormat } from "@/lib/exportImport";

interface Props {
  langue: Langue;
  cur: any;
  token: string | null;
  BASE_URL: string;
  onExport?: (format: ExportFormat) => void;
}

export function GestionServices({ langue, cur, token, BASE_URL, onExport }: Props) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEtage, setFilterEtage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nom: "", description: "", etage: "" });

  const fetchServices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/Services`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setServices(await res.json());
    } catch (err) { console.error("Erreur fetch services:", err); }
  };

  useEffect(() => { fetchServices(); }, []);

  const filtered = services.filter(s => {
    const matchSearch = !searchTerm || s.nom.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEtage = !filterEtage || s.etage === filterEtage;
    return matchSearch && matchEtage;
  });

  const etages = [...new Set(services.map(s => s.etage).filter(Boolean))];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `${BASE_URL}/api/Services/${editingId}` : `${BASE_URL}/api/Services`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || (langue === "fr" ? "Erreur" : "خطأ"));
        return;
      }

      alert(editingId ? (langue === "fr" ? "Service modifié" : "تم تعديل المصلحة") : (langue === "fr" ? "Service créé" : "تم إنشاء المصلحة"));
      setShowForm(false);
      setEditingId(null);
      setForm({ nom: "", description: "", etage: "" });
      fetchServices();
    } catch (err: any) {
      alert((langue === "fr" ? "Erreur: " : "خطأ: ") + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(langue === "fr" ? "Supprimer ce service ?" : "هل تريد حذف هذه المصلحة؟")) return;
    try {
      await fetch(`${BASE_URL}/api/Services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchServices();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder={langue === "fr" ? "Rechercher nom/description" : "بحث بالاسم/الوصف"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-64 p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50"
          />
          <select value={filterEtage} onChange={(e) => setFilterEtage(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-white">
            <option value="">{langue === "fr" ? "Tous les étages" : "جميع الطوابق"}</option>
            {etages.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button type="button" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ nom: "", description: "", etage: "" }); }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition">
            + {cur.ajouter}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4">
            {editingId ? (langue === "fr" ? "Modifier le service" : "تعديل المصلحة") : (langue === "fr" ? "Ajouter un service" : "إضافة مصلحة")}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Nom *" : "الاسم *"}</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Description" : "الوصف"}</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Étage" : "الطابق"}</label>
              <input type="text" value={form.etage} onChange={(e) => setForm({ ...form, etage: e.target.value })}
                placeholder={langue === "fr" ? "1er, 2ème, RDC..." : "الطابق 1، 2، الأرضي..."}
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition">
                {editingId ? (langue === "fr" ? "Modifier" : "تعديل") : cur.ajouter}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition">
                {cur.fermer}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-xs">
            {langue === "fr" ? "Services" : "المصالح"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {filtered.length} {langue === "fr" ? "services" : "مصلحة"}
            </span>
            {onExport && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onExport("excel")}
                  className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => onExport("word")}
                  className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 hover:bg-blue-100"
                >
                  Word
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-sky-50 border-b border-sky-200 text-slate-700">
              <tr>
                <th className="p-3 text-start">ID</th>
                <th className="p-3 text-start">{langue === "fr" ? "Nom" : "الاسم"}</th>
                <th className="p-3 text-start">{langue === "fr" ? "Description" : "الوصف"}</th>
                <th className="p-3 text-start">{langue === "fr" ? "Étage" : "الطابق"}</th>
                <th className="p-3 text-center">{cur.tblActions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">{cur.aucunDoc}</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono">{s.id}</td>
                    <td className="p-3 font-bold">{s.nom}</td>
                    <td className="p-3">{s.description}</td>
                    <td className="p-3">{s.etage}</td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => { setEditingId(s.id); setForm({ nom: s.nom, description: s.description, etage: s.etage }); setShowForm(true); }}
                          className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {langue === "fr" ? "Modifier" : "تعديل"}
                        </button>
                        <button type="button" onClick={() => handleDelete(s.id)}
                          className="px-2 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold">
                          {cur.btnSupprimer}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
