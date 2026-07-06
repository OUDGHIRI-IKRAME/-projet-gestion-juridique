"use client";

import { useState, useEffect } from "react";
import { Langue, UserItem } from "@/app/types";
import { SERVICE_GROUPS, getRoleLabel as getRoleLabelCentral } from "@/lib/constants";
import { ExportFormat } from "@/lib/exportImport";

interface Props {
  langue: Langue;
  cur: any;
  token: string | null;
  BASE_URL: string;
  onExport?: (format: ExportFormat) => void;
}

const ROLES = [
  { value: "Admin", fr: "Admin", ar: "مدير" },
  { value: "Directeur", fr: "Directeur", ar: "مدير عام" },
  { value: "Greffier", fr: "Greffier", ar: "أمين الضبط" },
  { value: "Enregistrement", fr: "Enregistrement", ar: "تسجيل" },
  { value: "Archive", fr: "Archive", ar: "أرشيف" },
  { value: "Employe", fr: "Employé", ar: "موظف" },
  { value: "Procedures", fr: "Procédures", ar: "إجراءات" },
  { value: "Consultant", fr: "Consultant", ar: "مستشار" },
];

function getAllServices() {
  return SERVICE_GROUPS.flatMap(g => g.children.map(c => c.value));
}

export function GestionUtilisateurs({ langue, cur, token, BASE_URL, onExport }: Props) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterService, setFilterService] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nom: "", login: "", password: "", service: "", role: "Employe" });
  const allServices = getAllServices();

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/Users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error("Erreur fetch users:", err); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !searchTerm || u.nom.toLowerCase().includes(searchTerm.toLowerCase()) || u.login.toLowerCase().includes(searchTerm.toLowerCase());
    const matchService = !filterService || u.service === filterService;
    return matchSearch && matchService;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `${BASE_URL}/api/Users/${editingId}` : `${BASE_URL}/api/Users`;
      const method = editingId ? "PUT" : "POST";
      const body: any = { nom: form.nom, login: form.login, role: form.role, service: form.service };
      if (form.password) body.password = form.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || (langue === "fr" ? "Erreur" : "خطأ"));
        return;
      }

      alert(editingId ? (langue === "fr" ? "Utilisateur modifié" : "تم تعديل المستخدم") : (langue === "fr" ? "Utilisateur créé" : "تم إنشاء المستخدم"));
      setShowForm(false);
      setEditingId(null);
      setForm({ nom: "", login: "", password: "", service: "", role: "Employe" });
      fetchUsers();
    } catch (err: any) {
      alert((langue === "fr" ? "Erreur: " : "خطأ: ") + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(langue === "fr" ? "Supprimer cet utilisateur ?" : "هل تريد حذف هذا المستخدم؟")) return;
    try {
      await fetch(`${BASE_URL}/api/Users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const startEdit = (u: UserItem) => {
    setEditingId(u.id);
    setForm({ nom: u.nom, login: u.login, password: "", service: u.service, role: u.role });
    setShowForm(true);
  };

  const getRoleLabel = (role: string) => {
    const found = ROLES.find(r => r.value === role);
    if (!found) return role;
    return langue === "fr" ? found.fr : found.ar;
  };

  const getServiceLabel = (value: string) => {
    for (const group of SERVICE_GROUPS) {
      for (const child of group.children) {
        if (child.value === value) return langue === "fr" ? child.fr : child.ar;
      }
    }
    return getRoleLabelCentral(value, langue);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder={langue === "fr" ? "Rechercher (nom, login)" : "بحث (الاسم، تسجيل الدخول)"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-64 p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50"
          />
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
          >
            <option value="">{langue === "fr" ? "Tous les services" : "جميع المصالح"}</option>
            {SERVICE_GROUPS.map(group => (
              <optgroup key={group.label} label={group.fr}>
                {group.children.map(svc => (
                  <option key={svc.value} value={svc.value}>{langue === "fr" ? svc.fr : svc.ar}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ nom: "", login: "", password: "", service: "", role: "Employe" }); }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
          >
            + {cur.ajouter}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4">
            {editingId ? (langue === "fr" ? "Modifier l'utilisateur" : "تعديل المستخدم") : (langue === "fr" ? "Ajouter utilisateur" : "إضافة مستخدم")}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Nom complet *" : "الاسم الكامل *"}</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{cur.login} *</label>
              <input type="text" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Mot de passe *" : "كلمة المرور *"}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? (langue === "fr" ? "Laisser vide pour ne pas changer" : "اتركه فارغاً لعدم التغيير") : ""}
                required={!editingId}
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Service *" : "المصلحة *"}</label>
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500">
                <option value="">{langue === "fr" ? "Sélectionner un service" : "اختر مصلحة"}</option>
                {SERVICE_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.fr}>
                    {group.children.map(svc => (
                      <option key={svc.value} value={svc.value}>{langue === "fr" ? svc.fr : svc.ar}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{langue === "fr" ? "Rôle *" : "الدور *"}</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required
                className="w-full border border-slate-300 p-2.5 rounded-lg text-xs outline-none focus:border-blue-500">
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{langue === "fr" ? r.fr : r.ar}</option>
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
            {langue === "fr" ? "Utilisateurs" : "المستخدمون"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {filtered.length} {langue === "fr" ? "utilisateurs" : "مستخدم"}
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
                <th className="p-3 text-start">{langue === "fr" ? "Nom complet" : "الاسم الكامل"}</th>
                <th className="p-3 text-start">{cur.login}</th>
                <th className="p-3 text-start">{langue === "fr" ? "Service" : "المصلحة"}</th>
                <th className="p-3 text-start">{langue === "fr" ? "Rôle" : "الدور"}</th>
                <th className="p-3 text-center">{cur.tblActions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold">{cur.aucunDoc}</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-mono">{u.id}</td>
                    <td className="p-3 font-bold">{u.nom}</td>
                    <td className="p-3 font-mono">{u.login}</td>
                    <td className="p-3">{getServiceLabel(u.service)}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => startEdit(u)}
                          className="px-2 py-1 rounded border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold">
                          {langue === "fr" ? "Modifier" : "تعديل"}
                        </button>
                        <button type="button" onClick={() => handleDelete(u.id)}
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
