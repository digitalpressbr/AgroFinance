import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const PIN_KEY = "agrofinance_admin_pin";

export default function ModalAdminPin({ open, onOpenChange, onSucesso }) {
  const pinExistente = (() => {
    try { return localStorage.getItem(PIN_KEY) || ""; } catch { return ""; }
  })();
  const modoCriacao = !pinExistente;

  const [pin, setPin] = useState(["", "", "", ""]);
  const [pinConfirma, setPinConfirma] = useState(["", "", "", ""]);
  const [erro, setErro] = useState("");
  const refsPin = useRef([]);
  const refsConfirma = useRef([]);

  useEffect(() => {
    if (open) {
      setPin(["", "", "", ""]);
      setPinConfirma(["", "", "", ""]);
      setErro("");
      setTimeout(() => refsPin.current[0]?.focus(), 50);
    }
  }, [open]);

  const handleDigit = (refs, arr, setArr, idx, val, onComplete) => {
    if (!/^\d?$/.test(val)) return;
    const novo = [...arr];
    novo[idx] = val;
    setArr(novo);
    setErro("");
    if (val && idx < 3) refs.current[idx + 1]?.focus();
    if (novo.every(d => d !== "") && onComplete) onComplete(novo.join(""));
  };

  const handleKey = (refs, arr, idx, e) => {
    if (e.key === "Backspace" && !arr[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const validarLogin = (digitado) => {
    if (digitado === pinExistente) {
      onSucesso();
    } else {
      setErro("PIN incorreto.");
      setPin(["", "", "", ""]);
      setTimeout(() => refsPin.current[0]?.focus(), 50);
    }
  };

  const checarCriacao = () => {
    const a = pin.join("");
    const b = pinConfirma.join("");
    if (a.length !== 4 || b.length !== 4) {
      setErro("Preencha os 4 dígitos em ambos os campos.");
      return;
    }
    if (a !== b) {
      setErro("Os PINs não coincidem. Tente novamente.");
      setPinConfirma(["", "", "", ""]);
      setTimeout(() => refsConfirma.current[0]?.focus(), 50);
      return;
    }
    try { localStorage.setItem(PIN_KEY, a); } catch {}
    onSucesso();
  };

  const renderInputs = (arr, setArr, refs, onComplete) => (
    <div className="flex gap-2 justify-center">
      {arr.map((d, idx) => (
        <input
          key={idx}
          ref={el => refs.current[idx] = el}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleDigit(refs, arr, setArr, idx, e.target.value, onComplete)}
          onKeyDown={e => handleKey(refs, arr, idx, e)}
          className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-gray-800 focus:outline-none"
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center">
            {modoCriacao ? "Criar PIN do Admin" : "Entrar no Modo Admin"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {modoCriacao
              ? "Defina um PIN de 4 dígitos para acessar o Modo Admin."
              : "Digite o PIN de 4 dígitos."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {modoCriacao && (
              <p className="text-xs text-gray-500 text-center">PIN</p>
            )}
            {renderInputs(
              pin,
              setPin,
              refsPin,
              modoCriacao ? undefined : validarLogin
            )}
          </div>

          {modoCriacao && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 text-center">Confirmar PIN</p>
              {renderInputs(pinConfirma, setPinConfirma, refsConfirma)}
            </div>
          )}

          {erro && (
            <p className="text-center text-sm text-red-600 font-medium">{erro}</p>
          )}

          {modoCriacao && (
            <Button onClick={checarCriacao} className="w-full bg-gray-900 hover:bg-gray-800">
              Confirmar e entrar como Admin
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}