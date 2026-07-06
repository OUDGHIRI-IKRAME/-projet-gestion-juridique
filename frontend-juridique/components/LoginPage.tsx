"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Langue } from '@/app/types';

export default function LoginPage({ langue = "ar" }: { langue?: Langue }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login: loginUser } = useAuth();
  const [lang, setLang] = useState<Langue>(langue);

  const t = {
    fr: {
      title: "Cour d'Appel Administrative",
      subtitle: "Connexion à la plateforme de gestion",
      identifiant: "Identifiant",
      motDePasse: "Mot de passe",
      seConnecter: "Se connecter",
      errorPrefix: "Erreur",
    },
    ar: {
      title: "الاستئنافية الإدارية",
      subtitle: "الوصول إلى منصة التدبير",
      identifiant: "اسم المستخدم",
      motDePasse: "كلمة المرور",
      seConnecter: "تسجيل الدخول",
      errorPrefix: "خطأ",
    }
  };

  const current = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginUser(login, password);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            className="px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-bold hover:bg-slate-100"
          >
            {lang === "fr" ? "عربي" : "Français"}
          </button>
        </div>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Coat_of_arms_of_Morocco.svg" alt="Blason" className="w-16 h-16" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{current.title}</h2>
          <p className="text-sm text-slate-500">{current.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">{current.identifiant}</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="mt-1 w-full border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{current.motDePasse}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            {current.seConnecter}
          </button>
        </form>
      </div>
    </div>
  );
}