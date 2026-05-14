import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Padroniza: primeira letra maiúscula em cada palavra; preposições e siglas tratadas
const SIGLAS = new Set(['PIX','IOF','IPVA','IPTU','ITR','IR','INSS','FGTS','ICMS','ISS','SANEAGO','SA','LTDA','ME','EPP','BB','CEF','TV','NET','GNV','GLP','KM','S.A.']);
const PREP = new Set(['de','da','do','das','dos','e','em','na','no','para','por','com','sem']);

function padronizar(raw) {
  if (!raw) return '';
  const limpo = String(raw).trim().replace(/\s+/g, ' ');
  if (!limpo) return '';
  return limpo.split(' ').map((p, i) => {
    if (!p) return p;
    const upper = p.toUpperCase();
    if (SIGLAS.has(upper)) return upper;
    if (p.length <= 4 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]+$/.test(p)) return upper;
    const lower = p.toLowerCase();
    if (i > 0 && PREP.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

export default function SelectComCadastro({ label, icone, value, onChange, opcoes, onCriar, placeholder = "Selecione..." }) {
  const [showDialog, setShowDialog] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    const padronizado = padronizar(novoNome);
    if (!padronizado) { toast.error('Digite um nome válido'); return; }

    // Checa duplicata (case-insensitive)
    if (opcoes.some(o => o.nome.toLowerCase() === padronizado.toLowerCase())) {
      toast.error('Este nome já existe na lista');
      return;
    }

    setSalvando(true);
    try {
      await onCriar(padronizado);
      onChange(padronizado);
      setShowDialog(false);
      setNovoNome('');
      toast.success(`"${padronizado}" cadastrado!`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao cadastrar');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Label className="flex items-center gap-2">
        {icone}
        {label}
      </Label>
      <div className="flex gap-2 mt-1">
        <Select value={value || ""} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Nenhum —</SelectItem>
            {opcoes.filter(o => o.ativo !== false).map((o) => (
              <SelectItem key={o.id || o.nome} value={o.nome}>{o.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="icon" onClick={() => setShowDialog(true)} title={`Novo ${label.toLowerCase()}`}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cadastrar {label}</AlertDialogTitle>
            <AlertDialogDescription>
              Digite o nome. Será padronizado automaticamente (ex: "saneago" → "SANEAGO", "banco do brasil" → "Banco do Brasil").
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder={`Nome do ${label.toLowerCase()}`}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSalvar(); } }}
              autoFocus
            />
            {novoNome && (
              <p className="text-xs text-gray-500 mt-2">
                Será salvo como: <span className="font-semibold text-green-700">{padronizar(novoNome)}</span>
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando} onClick={() => setNovoNome('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSalvar} disabled={salvando || !novoNome.trim()} className="bg-green-600 hover:bg-green-700">
              {salvando ? 'Salvando...' : 'Cadastrar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}