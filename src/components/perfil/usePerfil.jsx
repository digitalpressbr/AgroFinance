import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "agrofinance_perfil";
const EVENT_NAME = "perfil-changed";

function lerPerfil() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "admin" ? "admin" : "escritorio";
  } catch {
    return "escritorio";
  }
}

function escreverPerfil(novo) {
  try {
    localStorage.setItem(STORAGE_KEY, novo);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: novo }));
  } catch {}
}

export default function usePerfil() {
  const [perfil, setPerfil] = useState(lerPerfil);

  useEffect(() => {
    const handler = () => setPerfil(lerPerfil());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const entrarAdmin = useCallback(() => {
    escreverPerfil("admin");
    setPerfil("admin");
  }, []);

  const sairAdmin = useCallback(() => {
    escreverPerfil("escritorio");
    setPerfil("escritorio");
  }, []);

  return {
    perfil,
    isAdmin: perfil === "admin",
    entrarAdmin,
    sairAdmin,
  };
}