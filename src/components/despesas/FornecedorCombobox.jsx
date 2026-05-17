import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, Loader2, Search, Building2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

function formatarCNPJ(valor) {
  const n = String(valor || '').replace(/\D/g, '').slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarCPF(valor) {
  const n = String(valor || '').replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function docMascarado(f) {
  if (f?.cnpj) return `CNPJ ${formatarCNPJ(f.cnpj)}`;
  if (f?.cpf) return `CPF ${formatarCPF(f.cpf)}`;
  return null;
}

export default function FornecedorCombobox({ value, onChange, fornecedores, onFornecedorCriado }) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [tipo, setTipo] = useState('pj');
  const [cnpjInput, setCnpjInput] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomePf, setNomePf] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const ordenados = useMemo(() => {
    return [...(fornecedores || [])].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [fornecedores]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return ordenados;
    const qNum = q.replace(/\D/g, '');
    return ordenados.filter(f => {
      if ((f.nome || '').toLowerCase().includes(q)) return true;
      if (qNum) {
        const cnpjNum = (f.cnpj || '').replace(/\D/g, '');
        const cpfNum = (f.cpf || '').replace(/\D/g, '');
        if (cnpjNum.includes(qNum) || cpfNum.includes(qNum)) return true;
      }
      return false;
    });
  }, [ordenados, busca]);

  const selecionado = ordenados.find(f => f.nome === value);

  const limparModal = () => {
    setTipo('pj');
    setCnpjInput('');
    setRazaoSocial('');
    setNomePf('');
    setCpfInput('');
    setConsultando(false);
  };

  const handleCnpjChange = async (raw) => {
    const formatado = formatarCNPJ(raw);
    setCnpjInput(formatado);
    const numeros = formatado.replace(/\D/g, '');
    if (numeros.length === 14) {
      setConsultando(true);
      try {
        const resp = await base44.functions.invoke('consultarCNPJ', { cnpj: numeros });
        const data = resp?.data || resp;
        if (data?.razao_social) {
          setRazaoSocial(data.razao_social);
        } else if (data?.error) {
          toast.warning('CNPJ não encontrado. Preencha a razão social manualmente.');
        }
      } catch (e) {
        console.error(e);
        toast.warning('Erro ao consultar CNPJ. Preencha manualmente.');
      } finally {
        setConsultando(false);
      }
    }
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      let payload;
      if (tipo === 'pj') {
        const cnpjNum = cnpjInput.replace(/\D/g, '');
        if (cnpjNum.length !== 14) { toast.error('CNPJ inválido'); setSalvando(false); return; }
        if (!razaoSocial.trim()) { toast.error('Razão social obrigatória'); setSalvando(false); return; }
        payload = { nome: razaoSocial.trim(), tipo: 'pj', cnpj: cnpjNum, ativo: true };
      } else {
        if (!nomePf.trim()) { toast.error('Nome obrigatório'); setSalvando(false); return; }
        const cpfNum = cpfInput.replace(/\D/g, '');
        if (cpfNum && cpfNum.length !== 11) { toast.error('CPF inválido'); setSalvando(false); return; }
        payload = { nome: nomePf.trim(), tipo: 'pf', ativo: true };
        if (cpfNum) payload.cpf = cpfNum;
      }
      const novo = await base44.entities.Fornecedor.create(payload);
      toast.success(`"${payload.nome}" cadastrado!`);
      onFornecedorCriado?.(novo);
      onChange(payload.nome);
      setShowDialog(false);
      limparModal();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao cadastrar fornecedor');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Label className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-blue-600" />
        Fornecedor
      </Label>
      <div className="flex gap-2 mt-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" role="combobox" aria-expanded={open}
              className="flex-1 justify-between font-normal">
              {selecionado ? (
                <span className="truncate">{selecionado.nome}</span>
              ) : value ? (
                <span className="truncate">{value}</span>
              ) : (
                <span className="text-muted-foreground">Selecione o fornecedor</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Buscar por nome ou CNPJ/CPF..." value={busca} onValueChange={setBusca} />
              <CommandList>
                <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                <CommandGroup>
                  {filtrados.map((f) => {
                    const doc = docMascarado(f);
                    return (
                      <CommandItem
                        key={f.id || f.nome}
                        value={f.nome}
                        onSelect={() => { onChange(f.nome); setOpen(false); setBusca(""); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", value === f.nome ? "opacity-100" : "opacity-0")} />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-medium truncate">{f.nome}</span>
                          {doc && <span className="text-xs text-muted-foreground truncate">{doc}</span>}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon" onClick={() => setShowDialog(true)} title="Novo fornecedor">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <AlertDialog open={showDialog} onOpenChange={(o) => { setShowDialog(o); if (!o) limparModal(); }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Novo Fornecedor</AlertDialogTitle>
            <AlertDialogDescription>Cadastre um novo fornecedor para usar nas contas a pagar.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            <RadioGroup value={tipo} onValueChange={setTipo} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pj" id="tipo-pj" />
                <Label htmlFor="tipo-pj" className="cursor-pointer">Pessoa Jurídica</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pf" id="tipo-pf" />
                <Label htmlFor="tipo-pf" className="cursor-pointer">Pessoa Física</Label>
              </div>
            </RadioGroup>

            {tipo === 'pj' ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600">CNPJ *</Label>
                  <div className="relative mt-1">
                    <Input
                      value={cnpjInput}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      disabled={consultando}
                    />
                    {consultando && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Razão Social *</Label>
                  <Input
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Preenchido automaticamente pelo CNPJ"
                    className="mt-1"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600">Nome Completo *</Label>
                  <Input value={nomePf} onChange={(e) => setNomePf(e.target.value)} placeholder="Ex: João da Silva" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">CPF (opcional)</Label>
                  <Input value={cpfInput} onChange={(e) => setCpfInput(formatarCPF(e.target.value))} placeholder="000.000.000-00" className="mt-1" />
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando || consultando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSalvar} disabled={salvando || consultando} className="bg-green-600 hover:bg-green-700">
              {salvando ? 'Salvando...' : 'Salvar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}