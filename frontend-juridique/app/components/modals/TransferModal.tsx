"use client";

import { useState } from "react";
import { CourrierSimule, Langue } from "@/app/types";
import { SERVICE_GROUPS, PARENT_CHILDREN, getChildrenOf, isParentService } from "@/lib/constants";

interface TransferModalProps {
  doc: CourrierSimule | null;
  onClose: () => void;
  onConfirm: (selectedServices: string[]) => void;
  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;
  transferMessage: string;
  setTransferMessage: (s: string) => void;
  transferMustReturn: boolean;
  setTransferMustReturn: (b: boolean) => void;
  langue: Langue;
  cur: any;
}

export function TransferModal({
  doc,
  onClose,
  onConfirm,
  selectedServices,
  setSelectedServices,
  transferMessage,
  setTransferMessage,
  transferMustReturn,
  setTransferMustReturn,
  langue,
  cur
}: TransferModalProps) {
  if (!doc) return null;

  const allChildValues = SERVICE_GROUPS.flatMap(g => g.children.map(c => c.value));

  const toggleService = (value: string) => {
    setSelectedServices(
      selectedServices.includes(value)
        ? selectedServices.filter((s) => s !== value)
        : [...selectedServices, value]
    );
  };

  const toggleParent = (parentValue: string) => {
    const children = getChildrenOf(parentValue);
    const allSelected = children.every((c) => selectedServices.includes(c));

    if (allSelected) {
      setSelectedServices(selectedServices.filter((s) => !children.includes(s)));
    } else {
      const next = new Set(selectedServices);
      for (const c of children) next.add(c);
      setSelectedServices(Array.from(next));
    }
  };

  const allChildSelected = allChildValues.every((v) => selectedServices.includes(v));

  const toggleAll = () => {
    if (allChildSelected) {
      setSelectedServices([]);
    } else {
      setSelectedServices([...allChildValues]);
    }
  };

  const isGroupFullySelected = (groupValues: string[]) =>
    groupValues.every((v) => selectedServices.includes(v));

  const toggleGroup = (groupValues: string[]) => {
    const allSelected = isGroupFullySelected(groupValues);
    if (allSelected) {
      setSelectedServices(selectedServices.filter((s) => !groupValues.includes(s)));
    } else {
      const next = new Set(selectedServices);
      for (const v of groupValues) next.add(v);
      setSelectedServices(Array.from(next));
    }
  };

  const isParentFullySelected = (parentValue: string) => {
    const children = getChildrenOf(parentValue);
    return children.length > 0 && children.every((c) => selectedServices.includes(c));
  };

  const isParentIndeterminate = (parentValue: string) => {
    const children = getChildrenOf(parentValue);
    return children.some((c) => selectedServices.includes(c)) && !isParentFullySelected(parentValue);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {langue === "fr" ? "Transférer le dossier" : "تحويل الملف"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{doc.reference} - {doc.objet}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>

        <div className="p-5 space-y-4">
          {selectedServices.length > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700">
                {selectedServices.length} {langue === "fr" ? "service(s) sélectionné(s)" : "مصلحة محددة"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedServices([])}
                className="text-[10px] text-blue-500 underline font-bold"
              >
                {langue === "fr" ? "Effacer" : "مسح"}
              </button>
            </div>
          )}

          <div className="space-y-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-3 bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={allChildSelected}
                ref={(el) => {
                  if (el) el.indeterminate = selectedServices.length > 0 && !allChildSelected;
                }}
                onChange={toggleAll}
                className="w-3.5 h-3.5 text-blue-600"
              />
              <p className="text-[11px] font-bold text-slate-500">
                {langue === "fr" ? "Tout sélectionner" : "تحديد الكل"}
              </p>
            </div>
            <div className="space-y-3">
              {SERVICE_GROUPS.map((group) => {
                const groupValues = group.children.map((c) => c.value);
                const parentVal = group.label;
                const hasParent = isParentService(parentVal);

                return (
                  <div key={group.label} className="border border-slate-200 rounded-lg p-2 bg-white">
                    <div className="flex items-center gap-2 mb-1">
                      {hasParent && (
                        <input
                          type="checkbox"
                          checked={isParentFullySelected(parentVal)}
                          ref={(el) => {
                            if (el) el.indeterminate = isParentIndeterminate(parentVal);
                          }}
                          onChange={() => toggleParent(parentVal)}
                          className="w-3.5 h-3.5 text-blue-600"
                        />
                      )}
                      <label className={`flex items-center gap-2 cursor-pointer ${!hasParent ? "ps-0" : ""}`}>
                        {!hasParent && (
                          <input
                            type="checkbox"
                            checked={isGroupFullySelected(groupValues)}
                            ref={(el) => {
                              if (el) el.indeterminate = selectedServices.some((s) => groupValues.includes(s)) && !isGroupFullySelected(groupValues);
                            }}
                            onChange={() => toggleGroup(groupValues)}
                            className="w-3.5 h-3.5 text-blue-600"
                          />
                        )}
                        <span className="text-[10px] font-bold text-slate-600">{langue === "fr" ? group.fr : group.ar}</span>
                        {hasParent && (
                          <span className="text-[9px] text-slate-400 ms-1">
                            {langue === "fr" ? "(+tous les enfants)" : "(+جميع الفروع)"}
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 ps-5">
                      {group.children.map((svc) => (
                        <label
                          key={svc.value}
                          className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-bold cursor-pointer transition ${
                            selectedServices.includes(svc.value)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(svc.value)}
                            onChange={() => toggleService(svc.value)}
                            className="w-3.5 h-3.5"
                          />
                          {langue === "fr" ? svc.fr : svc.ar}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">{cur.commentaire}</label>
            <textarea
              rows={3}
              value={transferMessage}
              onChange={(e) => setTransferMessage(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
              placeholder={langue === "fr" ? "Message ou remarque..." : "رسالة أو ملاحظة..."}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={transferMustReturn}
              onChange={(e) => setTransferMustReturn(e.target.checked)}
            />
            {cur.docsRetourner}
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
              {cur.fermer}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(selectedServices)}
              disabled={selectedServices.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {langue === "fr"
                ? `Transférer (${selectedServices.length})`
                : `تحويل (${selectedServices.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
