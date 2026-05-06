"use client";

import { useState } from "react";
import { dispararAcao, type ApiResponse } from "@/app/actions/dispararAcao";

export default function DispararButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setMessage(null);

    const result = await dispararAcao({ exemplo: "Teste de disparo" });

    if (result.success) {
      setMessage("✅ Ação disparada com sucesso!");
    } else {
      setMessage(`❌ Erro: ${result.error}`);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-sm"
      >
        {loading ? "Processando..." : "Disparar Ação"}
      </button>
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
}
