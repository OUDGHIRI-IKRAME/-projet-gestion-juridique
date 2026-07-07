"use client";

import { useState, useEffect } from "react";
import { Langue } from "@/app/types";
import { SERVICE_GROUPS, WORKFLOW_STEPS, getWorkflowProgress, getRoleLabel } from "@/lib/constants";
import { ExportFormat } from "@/lib/exportImport";

interface WorkspaceDoc {
  id: number;
  type: string;
 NumeroOrdre?: string;
  NumeroReference?: string;
  NumeroDossierJuridique?: string;
  Sujet?: string;
  Objet?: string;
  Expediteur?: string;
  Demandeur?: string;
  DateCreation?: string;
  DateReception?: string;
  DateEntree?: string;
  TypeCircuit?: string;
  MotifException?: string;
  ServiceActuel: number;
  StatutActuel: number;
  FilePath?: string;
  NumeroBureauOrdre?: string;
  EstSupprime?: boolean;
  EtapeJalsatActuelle?: string;
  EtatGlobal?: string;
  Circuit?: string;
  EtapeService?: number;
  JalsatTransaction?: string;
  TaslimTransaction?: string;
  AutoriteRetrait?: string;
  DestinataireExterne?: string;
  TribunalOrigine?: string;
  TribunalDestination?: string;
  NumeroEnvoi?: string;
  DateEnvoi?: string;
  transactions?: any[];
}

interface Note {
  id: number;
  documentId: number;
  contenu: string;
  auteur: string;
  service: string;
  dateCreation: string;
  dateModification?: string;
}

interface ModifRecord {
  id: number;
  documentId: number;
  champ: string;
  ancienneValeur?: string;
  nouvelleValeur?: string;
  utilisateur?: string;
  service?: string;
  dateModification: string;
}

interface Props {
  docId: number | null;
  onClose: () => void;
  token: string | null;
  BASE_URL: string;
  langue: Langue;
  cur: any;
  onTransfer?: (doc: any) => void;
}

type Tab = "info" | "notes" | "historique";

export function WorkspaceModal({ docId, onClose, token, BASE_URL, langue, cur, onTransfer }: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const [doc, setDoc] = useState<WorkspaceDoc | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [modifications, setModifications] = useState<ModifRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const SERVICE_LABELS: Record<string, string> = {
    BureauOrdre: langue === "fr" ? "Bureau d'ordre" : "مكتب الضبط",
    OuvertureDossier: langue === "fr" ? "Ouverture dossier" : "فتح الملفات",
    KitabaKhasa: langue === "fr" ? "Écriture spéciale" : "الكتابة الخاصة",
    JalsatWaIjra2at: langue === "fr" ? "Sessions et actions" : "الجلسات والإجراءات",
    Ijra2Baht: langue === "fr" ? "Enquêtes" : "التحقيقات",
    MofawidMalaki: langue === "fr" ? "Délégation royale" : "التفويض الملكي",
    Khibra: langue === "fr" ? "Expertise" : "الخبرة",
    MustacharMoqarir: langue === "fr" ? "Conseil/rapports" : "المستشار/التقارير",
    TaslimNusakh: langue === "fr" ? "Remise de copies" : "تسليم النسخ",
    Tabligh: langue === "fr" ? "Notification" : "الإبلاغ",
    TasfiyatSawa2ir: langue === "fr" ? "Règlement" : "تسوية Affairs",
    Archive: langue === "fr" ? "Archives" : "الأرشيف",
    BureauNotification: langue === "fr" ? "Notification" : "مكتب الإخطار",
    BureauExpertise: langue === "fr" ? "Expertise" : "مكتب الخبرة",
    CelluleInformatique: langue === "fr" ? "Informatique" : "الوحدة المعلوماتية",
    GestionFinanciere: langue === "fr" ? "Finance" : "التسيير المالي",
    CaisseTribunal: langue === "fr" ? "Caisse" : "صندوق المحكمة",
    BureauRecouvrement: langue === "fr" ? "Recouvrement" : "التحصيل",
    ProcduresCommissaireRoyal: langue === "fr" ? "Commissaire Royal" : "إجراءات المندوب الملكي",
    GestionPourvoisCassation: langue === "fr" ? "Pourvois" : "الطعون بالنقض",
    RemiseCopieJugement: langue === "fr" ? "Copie jugement" : "تسليم نسخ الحكم",
    Greffe: langue === "fr" ? "Greffe" : "الgreffe",
    Direction: langue === "fr" ? "Direction" : "المديرية",
    EfficaciteJudiciaire: langue === "fr" ? "Efficacité" : "الفعالية القضائية",
    Enregistrement: langue === "fr" ? "Enregistrement" : "التسجيل",
  };

  const getServiceLabel = (val: any): string => {
    if (typeof val === "number") {
      const keys = Object.keys(SERVICE_LABELS);
      if (val >= 0 && val < keys.length) return SERVICE_LABELS[keys[val]] || String(val);
      return String(val);
    }
    return SERVICE_LABELS[val] || getRoleLabel(val, langue) || String(val);
  };

  useEffect(() => {
    if (!docId || !token) return;
    setLoading(true);
    fetch(`${BASE_URL}/api/Workspace/document/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setDoc(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [docId, token]);

  useEffect(() => {
    if (!docId || !token) return;
    fetch(`${BASE_URL}/api/Workspace/document/${docId}/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setNotes(data))
      .catch(() => {});
  }, [docId, token]);

  useEffect(() => {
    if (!docId || !token) return;
    fetch(`${BASE_URL}/api/Workspace/document/${docId}/modifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setModifications(data))
      .catch(() => {});
  }, [docId, token]);

  const handleSave = async () => {
    if (!doc || !token) return;
    setSaving(true);
    try {
      await fetch(`${BASE_URL}/api/Workspace/document/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editFields),
      });
      const updated = await fetch(`${BASE_URL}/api/Workspace/document/${doc.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoc(await updated.json());
      setEditMode(false);
      setEditFields({});
      const mods = await fetch(`${BASE_URL}/api/Workspace/document/${doc.id}/modifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModifications(await mods.json());
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!doc || !token || !newNote.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Workspace/document/${doc.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: newNote }),
      });
      const note = await res.json();
      setNotes([note, ...notes]);
      setNewNote("");
    } catch (err) { console.error(err); }
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!token || !editingNoteText.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/Workspace/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: editingNoteText }),
      });
      const updated = await res.json();
      setNotes(notes.map((n) => (n.id === noteId ? updated : n)));
      setEditingNoteId(null);
    } catch (err) { console.error(err); }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!token) return;
    if (!window.confirm(langue === "fr" ? "Supprimer cette note ?" : "هل تريد حذف هذه الملاحظة؟")) return;
    try {
      await fetch(`${BASE_URL}/api/Workspace/notes/${noteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (err) { console.error(err); }
  };

  const startEdit = () => {
    if (!doc) return;
    setEditFields({
      NumeroOrdre: doc.NumeroOrdre || "",
      Expediteur: doc.Expediteur || "",
      Objet: doc.Objet || "",
      Sujet: doc.Sujet || "",
      TypeCircuit: doc.TypeCircuit || "",
      Demandeur: doc.Demandeur || "",
      EtatGlobal: doc.EtatGlobal || "",
      EtapeJalsatActuelle: doc.EtapeJalsatActuelle || "",
      Circuit: doc.Circuit || "",
      MotifException: doc.MotifException || "",
      JalsatTransaction: doc.JalsatTransaction || "",
      TaslimTransaction: doc.TaslimTransaction || "",
      AutoriteRetrait: doc.AutoriteRetrait || "",
      DestinataireExterne: doc.DestinataireExterne || "",
      TribunalOrigine: doc.TribunalOrigine || "",
      TribunalDestination: doc.TribunalDestination || "",
    });
    setEditMode(true);
  };

  const renderField = (label: string, key: string, value?: string) => {
    if (!editMode) {
      return (
        <div key={key} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{label}</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{value || "-"}</span>
        </div>
      );
    }
    return (
      <div key={key} className="space-y-1">
        <label className="text-[10px] text-slate-500 dark:text-slate-400">{label}</label>
        <input
          type="text"
          value={editFields[key] || ""}
          onChange={(e) => setEditFields({ ...editFields, [key]: e.target.value })}
          className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs outline-none focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
        />
      </div>
    );
  };

  if (!docId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {langue === "fr" ? "Espace de travail" : "مساحة العمل"}
            </h2>
            {doc && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {doc.NumeroOrdre || doc.NumeroReference || doc.NumeroDossierJuridique || doc.NumeroEnvoi || ""} — {doc.Objet || ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editMode && (
              <button onClick={startEdit} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200 hover:bg-amber-100">
                {langue === "fr" ? "Modifier" : "تعديل"}
              </button>
            )}
            {editMode && (
              <>
                <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "..." : (langue === "fr" ? "Sauvegarder" : "حفظ")}
                </button>
                <button onClick={() => { setEditMode(false); setEditFields({}); }} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                  {langue === "fr" ? "Annuler" : "إلغاء"}
                </button>
              </>
            )}
            {onTransfer && (
              <button onClick={() => onTransfer(doc)} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200 hover:bg-indigo-100">
                {langue === "fr" ? "Transférer" : "تحويل"}
              </button>
            )}
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
              {langue === "fr" ? "Fermer" : "إغلاق"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {(["info", "notes", "historique"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-bold transition ${
                tab === t
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {t === "info" ? (langue === "fr" ? "Informations" : "المعلومات") :
               t === "notes" ? (langue === "fr" ? `Notes (${notes.length})` : `ملاحظات (${notes.length})`) :
               (langue === "fr" ? `Historique (${modifications.length})` : `السجل (${modifications.length})`)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">{langue === "fr" ? "Chargement..." : "جاري التحميل..."}</div>
          ) : !doc ? (
            <div className="text-center py-12 text-slate-400 text-xs">{langue === "fr" ? "Document non trouvé" : "لم يتم العثور على المستند"}</div>
          ) : (
            <>
              {/* TAB: Info */}
              {tab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {doc.NumeroOrdre && renderField(langue === "fr" ? "N° Ordre" : "رقم الطلب", "NumeroOrdre", doc.NumeroOrdre)}
                    {doc.NumeroReference && renderField(langue === "fr" ? "Référence" : "المرجع", "NumeroReference", doc.NumeroReference)}
                    {doc.NumeroDossierJuridique && renderField(langue === "fr" ? "N° Dossier" : "رقم الملف", "NumeroDossierJuridique", doc.NumeroDossierJuridique)}
                    {doc.NumeroEnvoi && renderField(langue === "fr" ? "N° Envoi" : "رقم الإرسال", "NumeroEnvoi", doc.NumeroEnvoi)}
                    {renderField(langue === "fr" ? "Objet" : "الموضوع", "Objet", doc.Objet)}
                    {doc.Sujet && renderField(langue === "fr" ? "Sujet" : "العنوان", "Sujet", doc.Sujet)}
                    {doc.Expediteur && renderField(langue === "fr" ? "Expéditeur" : "المرسل", "Expediteur", doc.Expediteur)}
                    {doc.Demandeur && renderField(langue === "fr" ? "Demandeur" : "المطالب", "Demandeur", doc.Demandeur)}
                    {doc.DestinataireExterne && renderField(langue === "fr" ? "Destinataire" : "المستفيد", "DestinataireExterne", doc.DestinataireExterne)}
                    {doc.TypeCircuit && renderField(langue === "fr" ? "Type circuit" : "نوع الدائرة", "TypeCircuit", doc.TypeCircuit)}
                    {doc.MotifException && renderField(langue === "fr" ? "Motif exception" : "سبب الاستثناء", "MotifException", doc.MotifException)}
                    {doc.EtatGlobal && renderField(langue === "fr" ? "État global" : "الحالة العامة", "EtatGlobal", doc.EtatGlobal)}
                    {doc.EtapeJalsatActuelle && renderField(langue === "fr" ? "Étape Jalsat" : "مرحلة الجلسات", "EtapeJalsatActuelle", doc.EtapeJalsatActuelle)}
                    {doc.Circuit && renderField(langue === "fr" ? "Circuit" : "الدائرة", "Circuit", doc.Circuit)}
                    {doc.JalsatTransaction && renderField(langue === "fr" ? "Jalsat Transaction" : "عملية الجلسات", "JalsatTransaction", doc.JalsatTransaction)}
                    {doc.TaslimTransaction && renderField(langue === "fr" ? "Taslim Transaction" : "عملية التسليم", "TaslimTransaction", doc.TaslimTransaction)}
                    {doc.AutoriteRetrait && renderField(langue === "fr" ? "Autorité retrait" : "جهة السحب", "AutoriteRetrait", doc.AutoriteRetrait)}
                    {doc.TribunalOrigine && renderField(langue === "fr" ? "Tribunal origine" : "المحكمة المصدرة", "TribunalOrigine", doc.TribunalOrigine)}
                    {doc.TribunalDestination && renderField(langue === "fr" ? "Tribunal destination" : "المحكمة الوجهة", "TribunalDestination", doc.TribunalDestination)}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{langue === "fr" ? "Service actuel" : "المصلحة الحالية"}</span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{getServiceLabel(doc.ServiceActuel)}</p>
                  </div>
                </div>
              )}

              {/* TAB: Notes */}
              {tab === "notes" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={langue === "fr" ? "Ajouter une note..." : "أضف ملاحظة..."}
                      className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs outline-none focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
                    />
                    <button onClick={handleAddNote} disabled={!newNote.trim()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40 self-end">
                      {langue === "fr" ? "Ajouter" : "إضافة"}
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <p className="text-center text-slate-400 text-xs py-8">{langue === "fr" ? "Aucune note" : "لا توجد ملاحظات"}</p>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((n) => (
                        <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                          {editingNoteId === n.id ? (
                            <div className="space-y-2">
                              <textarea rows={2} value={editingNoteText} onChange={(e) => setEditingNoteText(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded text-xs outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none" />
                              <div className="flex gap-1">
                                <button onClick={() => handleUpdateNote(n.id)} className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold">{langue === "fr" ? "Sauvegarder" : "حفظ"}</button>
                                <button onClick={() => setEditingNoteId(null)} className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">{langue === "fr" ? "Annuler" : "إلغاء"}</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{n.contenu}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-slate-400">
                                  {n.auteur} — {getServiceLabel(n.service)} — {new Date(n.dateCreation).toLocaleDateString()}
                                  {n.dateModification && ` (${langue === "fr" ? "modifié" : "عدل"})`}
                                </span>
                                <div className="flex gap-1">
                                  <button onClick={() => { setEditingNoteId(n.id); setEditingNoteText(n.contenu); }} className="text-[10px] text-blue-500 hover:text-blue-700 font-bold">{langue === "fr" ? "Modifier" : "تعديل"}</button>
                                  <button onClick={() => handleDeleteNote(n.id)} className="text-[10px] text-red-500 hover:text-red-700 font-bold">{langue === "fr" ? "Supprimer" : "حذف"}</button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Historique */}
              {tab === "historique" && (
                <div className="space-y-4">
                  {modifications.length === 0 ? (
                    <p className="text-center text-slate-400 text-xs py-8">{langue === "fr" ? "Aucune modification enregistrée" : "لم يتم تسجيل أي تعديل"}</p>
                  ) : (
                    <div className="space-y-2">
                      {modifications.map((m) => (
                        <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.champ}</p>
                            <div className="flex gap-2 text-[11px] mt-1">
                              {m.ancienneValeur && (
                                <span className="line-through text-red-400">{m.ancienneValeur}</span>
                              )}
                              {m.ancienneValeur && <span className="text-slate-400">→</span>}
                              <span className="text-green-600 dark:text-green-400 font-bold">{m.nouvelleValeur || "-"}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {m.utilisateur} — {getServiceLabel(m.service)} — {new Date(m.dateModification).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
