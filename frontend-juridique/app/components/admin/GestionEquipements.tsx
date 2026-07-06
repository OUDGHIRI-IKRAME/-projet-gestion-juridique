"use client";

import { useState, useEffect } from "react";
import { Langue, EquipmentItem } from "@/app/types";
import { SERVICE_GROUPS, getRoleLabel } from "@/lib/constants";
import { ExportFormat } from "@/lib/exportImport";

interface Props {
  langue: Langue;
  cur: any;
  token: string | null;
  BASE_URL: string;
  onExport?: (format: ExportFormat) => void;
}

function getAllServices() {
  return SERVICE_GROUPS.flatMap(g => g.children.map(c => c.value));
}

export function GestionEquipements({ langue, cur, token, BASE_URL, onExport }: Props) {
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterEtat, setFilterEtat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ serial: "", code: "", type: "", etat: "", service: "" });
  const allServices = getAllServices();

  const fetchItems = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/Equipment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setItems(await res.json());
    } catch (err) { console.error("Erreur fetch equipment:", err); }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(i => {
    const matchSearch = !searchTerm || i.serial.toLowerCase().includes(searchTerm.toLowerCase()) || i.code.toLowerCase().includes(searchTerm.toLowerCase()) || i.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || i.type === filterType;
    const matchEtat = !filterEtat || i.etat === filterEtat;
    return matchSearch && matchType && matchEtat;
  });

  const types = [...new Set(items.map(i => i.type).filter(Boolean))];
  const etats = [...new Set(items.map(i => i.etat).filter(Boolean))];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `${BASE_URL}/api/Equipment/${editingId}` : `${BASE_URL}/api/Equipment`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, estCharge: true }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || (langue === "fr" ? "Erreur" : "خطأ"));
        return;
      }

      alert(editingId ? (langue === "fr" ? "Équipement modifié" : "تم تعديل المعدات") : (langue === "fr" ? "Équipement créé" : "تم إنشاء المعدات"));
      setShowForm(false);
      setEditingId(null);
      setForm({ serial: "", code: "", type: "", etat: "", service: "" });
      fetchItems();
    } catch (err: any) {
      alert((langue === "fr" ? "Erreur: " : "خطأ: ") + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(langue === "fr" ? "Supprimer cet équipement ?" : "هل تريد حذف هذه المعدة؟")) return;
    try {
      await fetch(`${BASE_URL}/api/Equipment/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const toggleCharge = async (id: number) => {
    try {
      await fetch(`${BASE_URL}/api/Equipment/${id}/toggle-charge`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchItems();
    } catch (err) { console.error(err); }
  };

  const getServiceLabel = (value: string) => {
    for (const group of SERVICE_GROUPS) {
      for (const child of group.children) {
        if (child.value === value) return langue === "fr" ? child.fr : child.ar;
      }
    }
    return getRoleLabel(value, langue);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <input type="text" placeholder={langue === "fr" ? "Rechercher (série, service)" : "بحث (سلسلة، مصلحة)"}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-64 p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-white">
            <option value="">{langue === "fr" ? "Tous types" : "جميع الأنواع"}</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterEtat} onChange={(e) => setFilterEtat(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-white">
            <option value="">{langue === "fr" ? "Tous états" : "جميع الحالات"}</option>
            {etats.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <button type="button" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ serial: "", code: "", type: "", etat: "", service: "" }); }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition">
            + {cur.ajouter}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4">
            {editingId ? (langue === "fr" ? "Modifier l'équipement" : "تعديل المعدة") : (langue === "fr" ? "Ajouter un équipement" : "إضافة معدة")}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{cur.serie} *</label>
              <input type="text" value={form.serial} onChange={(e) => setForm({ ...form, serial: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Type *" : "النوع *"}</label>
              <input type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "État *" : "الحالة *"}</label>
              <input type="text" value={form.etat} onChange={(e) => setForm({ ...form, etat: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Service *" : "المصلحة *"}</label>
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500">
                <option value="">{langue === "fr" ? "Service" : "مصلحة"}</option>
                {SERVICE_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.fr}>
                    {group.children.map(svc => (
                      <option key={svc.value} value={svc.value}>{langue === "fr" ? svc.fr : svc.ar}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="md:col-span-5 flex gap-2">
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition">
                {editingId ? (langue === "fr" ? "Modifier" : "تعديل") : cur.ajouter}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition">
                {cur.fermer}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-xs">
            {langue === "fr" ? "Équipements" : "المعدات"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {filtered.length} {langue === "fr" ? "équipements" : "معدة"}
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
                <th className="p-3 text-start">{cur.serie}</th>
                <th className="p-3 text-start">{cur.code}</th>
                <th className="p-3 text-start">{langue === "fr" ? "Type" : "النوع"}</th>
                <th className="p-3 text-start">{langue === "fr" ? "État" : "الحالة"}</th>
                <th className="p-3 text-start">{cur.service}</th>
                <th className="p-3 text-center">{langue === "fr" ? "Chargé" : "محمل"}</th>
                <th className="p-3 text-center">{cur.tblActions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-bold">{cur.aucunDoc}</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono">{item.id}</td>
                    <td className="p-3 font-mono">{item.serial}</td>
                    <td className="p-3">{item.code}</td>
                    <td className="p-3">{item.type}</td>
                    <td className="p-3">{item.etat}</td>
                    <td className="p-3">{getServiceLabel(item.service)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.estCharge ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {item.estCharge ? (langue === "fr" ? "Chargé" : "محمل") : (langue === "fr" ? "Déchargé" : "غير محمل")}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <button type="button" onClick={() => { setEditingId(item.id); setForm({ serial: item.serial, code: item.code, type: item.type, etat: item.etat, service: item.service }); setShowForm(true); }}
                          className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {langue === "fr" ? "Modifier" : "تعديل"}
                        </button>
                        <button type="button" onClick={() => toggleCharge(item.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${item.estCharge ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                          {item.estCharge ? (langue === "fr" ? "Décharger" : "تفريغ") : (langue === "fr" ? "Charger" : "تحميل")}
                        </button>
                        <button type="button" onClick={() => handleDelete(item.id)}
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
