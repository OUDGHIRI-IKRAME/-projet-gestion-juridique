import * as XLSX from "xlsx";
import mammoth from "mammoth";

export type ExportFormat = "excel" | "word";

export interface ExportRow {
  [key: string]: string | number | boolean | undefined;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 500);
}

function downloadBuffer(buffer: ArrayBuffer, name: string, mime: string) {
  const blob = new Blob([buffer], { type: mime });
  downloadBlob(blob, name);
}

function getNowFR(): string {
  return new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR");
}

export function exportRows(rows: ExportRow[], filename: string, format: ExportFormat, title?: string) {
  if (rows.length === 0) {
    alert("Aucune donnée à exporter / لا توجد بيانات للتصدير");
    return;
  }
  const headers = Object.keys(rows[0]);

  switch (format) {
    case "excel":
      exportExcel(rows, headers, filename, title);
      break;
    case "word":
      exportWord(rows, headers, filename, title);
      break;
  }
}

function buildHeaderLines(): string[] {
  return [
    "ROYAUME DU MAROC",
    "Cour d'Appel Administrative de Fes",
    "Direction des Affaires Juridiques",
  ];
}

function exportExcel(rows: ExportRow[], headers: string[], filename: string, title?: string) {
  try {
    const dateStr = getNowFR();
    const hdr = buildHeaderLines();

    const wsData: any[][] = [
      ...hdr.map((h) => [h]),
      [],
      [`Date : ${dateStr}   |   Enregistrements : ${rows.length}`],
      [],
      headers,
      ...rows.map((row) => headers.map((h) => String(row[h] ?? ""))),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!cols"] = headers.map(() => ({ wch: 24 }));

    const numCols = headers.length;
    ws["!merges"] = hdr.map((_, i) => ({ s: { r: i, c: 0 }, e: { r: i, c: numCols - 1 } }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Donnees");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const name = filename.endsWith(".xlsx") ? filename : filename + ".xlsx";
    downloadBuffer(wbout, name, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  } catch (err: any) {
    console.error("Excel export error:", err);
    alert("Erreur Excel: " + (err.message || ""));
  }
}

function exportWord(rows: ExportRow[], headers: string[], filename: string, title?: string) {
  try {
    const dateStr = getNowFR();
    const hdr = buildHeaderLines();

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8">
    <style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 11px; margin: 25px 30px; color: #000; }
      .header { margin-bottom: 18px; }
      .header p { margin: 1px 0; }
      .h1 { font-size: 13px; }
      .h2 { font-size: 11px; }
      .meta { font-size: 9px; color: #555; margin: 10px 0 14px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #bbb; padding: 4px 7px; text-align: left; font-size: 10px; }
      th { background: #f2f2f2; font-weight: bold; }
    </style></head><body>

    <div class="header">
      <p class="h1">${hdr[0]}</p>
      <p class="h1">${hdr[1]}</p>
      <p class="h2">${hdr[2]}</p>
    </div>

    <p class="meta">Date : ${dateStr} &nbsp;|&nbsp; ${rows.length} enregistrement(s)</p>

    <table><thead><tr>`;
    headers.forEach((h) => (html += `<th>${h}</th>`));
    html += `</tr></thead><tbody>`;
    rows.forEach((row) => {
      html += `<tr>`;
      headers.forEach((h) => (html += `<td>${String(row[h] ?? "").replace(/</g, "&lt;")}</td>`));
      html += `</tr>`;
    });
    html += `</tbody></table></body></html>`;

    const blob = new Blob(["\ufeff" + html], { type: "application/msword;charset=utf-8" });
    downloadBlob(blob, filename.endsWith(".doc") ? filename : filename + ".doc");
  } catch (err: any) {
    console.error("Word export error:", err);
    alert("Erreur Word: " + (err.message || ""));
  }
}

export function parseCSV(text: string): ExportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = parseCSVLine(lines[0], sep);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line, sep);
    const row: ExportRow = {};
    headers.forEach((h, i) => (row[h] = values[i] || ""));
    return row;
  });
}

function parseCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === sep) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export function importFromFile(file: File): Promise<ExportRow[]> {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv" || ext === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(parseCSV(text));
      };
      reader.onerror = () => reject(new Error("Erreur de lecture / خطأ في القراءة"));
      reader.readAsText(file, "UTF-8");
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(ws) as ExportRow[];
          resolve(jsonData);
        } catch (err) {
          reject(new Error("Erreur de lecture Excel / خطأ في قراءة Excel"));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture / خطأ في القراءة"));
      reader.readAsArrayBuffer(file);
    } else if (ext === "doc" || ext === "docx") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          if (!text.trim()) { resolve([]); return; }
          const lines = text.split(/\r?\n/).filter((l) => l.trim());
          if (lines.length === 0) { resolve([]); return; }
          const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : lines[0].includes(",") ? "," : null;
          if (sep) {
            resolve(parseCSV(lines.join("\n")));
          } else {
            resolve(lines.map((line, i) => ({ Ligne: i + 1, Contenu: line.trim() })));
          }
        } catch (err) {
          reject(new Error("Erreur de lecture Word / خطأ في قراءة Word"));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture / خطأ في القراءة"));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Format non supporté / صيغة غير مدعومة"));
    }
  });
}
