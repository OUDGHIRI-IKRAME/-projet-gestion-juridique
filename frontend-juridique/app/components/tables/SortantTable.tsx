"use client";

import { CourrierSimule } from "@/app/types";
import { normalizeStatus } from "@/lib/utils";
import { ExportFormat } from "@/lib/exportImport";
import { getWorkflowProgress, getDelayDays } from "@/lib/constants";

interface SortantTableProps {
  documents: CourrierSimule[];
  filtreStatut: string;
  setFiltreStatut: (statut: string) => void;
  onView: (doc: CourrierSimule) => void;
  onTransfer: (doc: CourrierSimule) => void;
  onDelete: (doc: CourrierSimule) => void;
  onOpen?: (doc: CourrierSimule) => void;
  onMarquerEnvoye: (id: number) => void;
  onMarquerAttente: (id: number) => void;
  onAnnuler: (id: number) => void;
  cur: any;
  langue?: "fr" | "ar";
  onExport?: (format: ExportFormat) => void;
}

export function SortantTable({
  documents,
  filtreStatut,
  setFiltreStatut,
  onView,
  onTransfer,
  onDelete,
  onOpen,
  onMarquerEnvoye,
  onMarquerAttente,
  onAnnuler,
  cur,
  langue = "fr",
  onExport
}: SortantTableProps) {
  const statuts = ["tous", "Brouillon", "EnAttente", "Envoye", "Annule"];
  const statutLabels: Record<string, string> = {
    tous: cur.filtreTous,
    Brouillon: cur.filtreBrouillon,
    EnAttente: cur.filtreAttente,
    Envoye: cur.filtreEnvoye,
    Annule: cur.filtreAnnule
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden mt-8">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-xs">{cur.sortants}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{documents.length} {cur.documents}</span>
          {onExport && (
            <div className="flex gap-1">
              <button type="button" onClick={() => onExport("excel")} className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100">Excel</button>
              <button type="button" onClick={() => onExport("word")} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 hover:bg-blue-100">Word</button>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-2">
        {statuts.map((statut) => (
          <button key={statut} onClick={() => setFiltreStatut(statut)} className={`px-3 py-1 text-xs font-bold rounded-full transition ${filtreStatut === statut ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-300"}`}>
            {statutLabels[statut]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 text-[11px]">
              <th className="p-3 text-start">{cur.tblTitre}</th>
              <th className="p-3 text-start">{cur.tblRef}</th>
              <th className="p-3 text-start">{cur.tblType}</th>
              <th className="p-3 text-start">{cur.tblDate}</th>
              <th className="p-3 text-start">{cur.tblSource}</th>
              <th className="p-3 text-start">{langue === "fr" ? "Mahkama origine" : "المحكمة المصدرة"}</th>
              <th className="p-3 text-start">{langue === "fr" ? "Mahkama dest." : "المحكمة المستقبلة"}</th>
              <th className="p-3 text-center">{langue === "fr" ? "Avancement" : "التقدم"}</th>
              <th className="p-3 text-center">{cur.tblActions}</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center font-bold text-slate-400 bg-slate-50/50">{cur.aucunDoc}</td>
              </tr>
            ) : (
              documents.map((doc) => {
                const statutBrut = normalizeStatus(doc.statut);
                const progress = getWorkflowProgress(doc.serviceActuelKey || doc.serviceActuel);
                const delayDays = getDelayDays(doc.dateRaw || doc.date);
                const isLate = delayDays > 7;

                return (
                  <tr key={doc.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isLate ? "bg-red-50/50" : ""}`}>
                    <td className="p-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {isLate && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>}
                        {doc.objet}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-600">{doc.reference}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                        {doc.type === "sortant-normal" ? cur.normal : cur.demande}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{doc.date}</td>
                    <td className="p-3 text-slate-700">{doc.source}</td>
                    <td className="p-3 text-slate-700">{doc.tribunalOrigine || "-"}</td>
                    <td className="p-3 text-slate-700">{doc.tribunalDestination || "-"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${progress.pct === 100 ? "bg-emerald-500" : progress.pct > 50 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${progress.pct}%` }}></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold w-6 text-end">{progress.label}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center space-x-1 whitespace-nowrap">
                      <button type="button" onClick={() => onView(doc)} className="text-blue-600 hover:text-blue-800 font-bold px-2 py-1 rounded hover:bg-blue-50">{cur.btnVoir}</button>
                      {statutBrut !== "Envoye" && statutBrut !== "Annule" && (
                        <>
                          <button onClick={() => onMarquerEnvoye(doc.id)} className="text-emerald-600 hover:text-emerald-800 font-bold px-2 py-1 rounded hover:bg-emerald-50">{cur.marquerEnvoye}</button>
                          <button onClick={() => onMarquerAttente(doc.id)} className="text-yellow-600 hover:text-yellow-800 font-bold px-2 py-1 rounded hover:bg-yellow-50">{cur.marquerAttente}</button>
                        </>
                      )}
                      {statutBrut !== "Annule" && (
                        <button onClick={() => onAnnuler(doc.id)} className="text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded hover:bg-red-50">{cur.annulerCourrier}</button>
                      )}
                      <button onClick={() => onTransfer(doc)} className="text-slate-600 hover:text-slate-800 font-bold px-2 py-1 rounded hover:bg-slate-50">{cur.btnSuivant}</button>
                      {onOpen && <button onClick={() => onOpen(doc)} className="text-emerald-600 hover:text-emerald-800 font-bold px-2 py-1 rounded hover:bg-emerald-50">{langue === "fr" ? "Ouvrir" : "فتح"}</button>}
                      <button onClick={() => onDelete(doc)} className="text-red-600 hover:text-red-800 font-bold px-2 py-1 rounded hover:bg-red-50">{cur.btnSupprimer}</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
