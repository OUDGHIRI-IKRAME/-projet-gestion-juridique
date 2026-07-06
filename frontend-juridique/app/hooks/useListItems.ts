"use client";

import { useState, useEffect } from "react";

export interface ListItem {
  id: number;
  listName: string;
  code: string;
  valueFr: string;
  valueAr: string;
  displayOrder: number;
  isActive: boolean;
}

const BASE_URL = "http://localhost:5200";

export function useListItems(token: string | null, listName?: string) {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const url = listName
      ? `${BASE_URL}/api/ListItems?listName=${listName}`
      : `${BASE_URL}/api/ListItems`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => setItems(data.filter((i: ListItem) => i.isActive)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token, listName]);

  const getLabel = (code: string, langue: "fr" | "ar") => {
    const item = items.find((i) => i.code === code);
    if (!item) return code;
    return langue === "fr" ? item.valueFr : item.valueAr;
  };

  const getOptions = (filterListName: string, langue: "fr" | "ar") => {
    return items
      .filter((i) => i.listName === filterListName)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((i) => ({
        value: i.code,
        label: langue === "fr" ? i.valueFr : i.valueAr
      }));
  };

  return { items, loading, getLabel, getOptions };
}
