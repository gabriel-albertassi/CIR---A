"use client";

import { useState } from "react";
import { dispararAcao, type ApiResponse } from "@/app/actions/dispararAcao";

export default function DispararButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    const res: ApiResponse = await dispararAcao({
      exemplo: "teste",
    });

    setLoading(false);

    // 🔥 TRATAMENTO CORRETO (SEM ERRO)
    if (!res.success) {
      setError(res.error);
      return;
    }

    alert("Disparado com sucesso!");
  };

  return (
    <div>
      <button 
        onClick={handleClick} 
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          background: 'linear-gradient(135deg, #00d8ff, #0088ff)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? "Enviando..." : "Disparar"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 10, fontSize: '0.8rem', fontWeight: 600 }}>
          {error}
        </p>
      )}
    </div>
  );
}
