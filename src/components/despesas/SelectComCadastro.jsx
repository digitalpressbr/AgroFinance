import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Loader2, Building2, User, FileText } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { sugerirCategorias } from "./cnaeCategorias";

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

export default function SelectComCadastro({ label, icone, value, onChange, opcoes, onCriar, placeholder = "Selecione...", modoCnpj = false, onSugerirCategorias }) {
  const [showDialog, setShowDialog] = useState(false);
  const [tipoAba, setTipoAba] = useState('pj'); // pj | pf | outro
  const [novoNome, setNovoNome] = useState('');
  const [cnpjInput, setCnpjInput] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [nomePf, setNomePf] = useState('');
  const [dadosCnpj, setDadosCnpj] = useState(null);
  const [consultando, setConsultando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const limparEstado = () => {
    setNovoNome('');
    setCnpjInput('');
    setCpfInput('');
    setNomePf('');
    setDadosCnpj(null);
    setTipoAba('pj');
  };

  const handleConsultarCNPJ = async () => {
    const numeros = cnpjInput.replace(/\D/g, '');
    if (numeros.length !== 14) {
      toast.error('Digite um CNPJ válido (14 dígitos)');
      return;
    }
    if (opcoes.some(o => o.cnpj && o.cnpj.replace(/\D/g, '') === numeros)) {
      toast.error('Este CNPJ já está cadastrado');
      return;
    }
    setConsultando(true);
    try {
      const resp = await base44.functions.invoke('consultarCNPJ', { cnpj: numeros });
      const data = resp?.data || resp;
      if (data?.error) { toast.error(data.error); return; }
      if (!data?.razao_social) { toast.error('Razão social não retornada pela API'); return; }
      const razao = padronizar(data.razao_social);
      setDadosCnpj({
        cnpj: data.cnpj,
        razao_social: razao,
        nome_fantasia: data.nome_fantasia ? padronizar(data.nome_fantasia) : '',
        cnae_fiscal: data.cnae_fiscal || '',
        cnae_fiscal_descricao: data.cnae_fiscal_descricao || ''
      });
      // Sugerir categorias com base no CNAE
      if (onSugerirCategorias) {
        const sugeridas = sugerirCategorias(data.cnae_fiscal, razao);
        onSugerirCategorias(sugeridas);
      }
      toast.success('CNPJ encontrado!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao consultar CNPJ');
    } finally {
      setConsultando(false);
    }
  };

  const handleSalvarCnpj = async () => {
    if (!dadosCnpj) return;
    setSalvando(true);
    try {
      await onCriar({ nome: dadosCnpj.razao_social, tipo: 'pj', cnpj: dadosCnpj.cnpj, nome_fantasia: dadosCnpj.nome_fantasia });
      onChange(dadosCnpj.razao_social);
      setShowDialog(false);
      limparEstado();
      toast.success(`"${dadosCnpj.razao_social}" cadastrado!`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao cadastrar');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarPf = async () => {
    const padronizado = padronizar(nomePf);
    if (!padronizado) { toast.error('Digite o nome'); return; }
    const cpfNumeros = cpfInput.replace(/\D/g, '');
    if (cpfNumeros && cpfNumeros.length !== 11) { toast.error('CPF deve ter 11 dígitos'); return; }
    if (cpfNumeros && opcoes.some(o => o.cpf && o.cpf.replace(/\D/g, '') === cpfNumeros)) {
      toast.error('Este CPF já está cadastrado');
      return;
    }
    if (opcoes.some(o => o.nome.toLowerCase() === padronizado.toLowerCase())) {
      toast.error('Este nome já existe na lista');
      return;
    }
    setSalvando(true);
    try {
      await onCriar({ nome: padronizado, tipo: 'pf', cpf: cpfNumeros || undefined });
      onChange(padronizado);
      setShowDialog(false);
      limparEstado();
      toast.success(`"${padronizado}" cadastrado!`);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao cadastrar');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarOutro = async () => {
    const padronizado = padronizar(novoNome);
    if (!padronizado) { toast.error('Digite um nome válido'); return; }
    if (opcoes.some(o => o.nome.toLowerCase() === padronizado.toLowerCase())) {
      toast.error('Este nome já existe na lista');
      return;
    }
    setSalvando(true);
    try {
      await onCriar(modoCnpj ? { nome: padronizado, tipo: 'outro' } : padronizado);
      onChange(padronizado);
      setShowDialog(false);
      limparEstado();
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

      <AlertDialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) limparEstado(); }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Cadastrar {label}</AlertDialogTitle>
            <AlertDialogDescription>
              {modoCnpj ? 'Escolha o tipo de fornecedor abaixo.' : 'Digite o nome. Será padronizado automaticamente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {modoCnpj ? (
            <Tabs value={tipoAba} onValueChange={setTipoAba} className="py-2">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="pj" className="text-xs"><Building2 className="w-3 h-3 mr-1" />Empresa</TabsTrigger>
                <TabsTrigger value="pf" className="text-xs"><User className="w-3 h-3 mr-1" />Pessoa Física</TabsTrigger>
                <TabsTrigger value="outro" className="text-xs"><FileText className="w-3 h-3 mr-1" />Outro</TabsTrigger>
              </TabsList>

              <TabsContent value="pj" className="space-y-3 mt-3">
                <div>
                  <Label className="text-xs text-gray-600">CNPJ</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={cnpjInput}
                      onChange={(e) => setCnpjInput(formatarCNPJ(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleConsultarCNPJ(); } }}
                      disabled={consultando || !!dadosCnpj}
                    />
                    <Button type="button" onClick={handleConsultarCNPJ} disabled={consultando || !!dadosCnpj || cnpjInput.replace(/\D/g, '').length !== 14} className="bg-blue-600 hover:bg-blue-700">
                      {consultando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {dadosCnpj && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 space-y-1">
                    <p className="text-xs text-green-700 font-medium">✓ Dados encontrados:</p>
                    <p className="text-sm"><span className="text-gray-600">Razão Social:</span> <span className="font-semibold text-green-800">{dadosCnpj.razao_social}</span></p>
                    {dadosCnpj.nome_fantasia && (
                      <p className="text-sm"><span className="text-gray-600">Nome Fantasia:</span> <span className="font-medium">{dadosCnpj.nome_fantasia}</span></p>
                    )}
                    {dadosCnpj.cnae_fiscal_descricao && (
                      <p className="text-xs text-gray-500">Atividade: {dadosCnpj.cnae_fiscal_descricao}</p>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pf" className="space-y-3 mt-3">
                <div>
                  <Label className="text-xs text-gray-600">Nome Completo *</Label>
                  <Input value={nomePf} onChange={(e) => setNomePf(e.target.value)} placeholder="Ex: João da Silva" />
                  {nomePf && <p className="text-xs text-gray-500 mt-1">Será salvo como: <span className="font-semibold text-green-700">{padronizar(nomePf)}</span></p>}
                </div>
                <div>
                  <Label className="text-xs text-gray-600">CPF (opcional)</Label>
                  <Input value={cpfInput} onChange={(e) => setCpfInput(formatarCPF(e.target.value))} placeholder="000.000.000-00" />
                  <p className="text-xs text-gray-500 mt-1">💡 Útil para identificação e histórico</p>
                </div>
              </TabsContent>

              <TabsContent value="outro" className="space-y-3 mt-3">
                <div>
                  <Label className="text-xs text-gray-600">Nome / Descrição *</Label>
                  <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: Receita Federal, INSS, Taxa CREA" autoFocus />
                  {novoNome && <p className="text-xs text-gray-500 mt-1">Será salvo como: <span className="font-semibold text-green-700">{padronizar(novoNome)}</span></p>}
                  <p className="text-xs text-gray-500 mt-2">💡 Para órgãos públicos, taxas, impostos, etc.</p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-2">
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder={`Nome do ${label.toLowerCase()}`}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSalvarOutro(); } }}
                autoFocus
              />
              {novoNome && <p className="text-xs text-gray-500 mt-2">Será salvo como: <span className="font-semibold text-green-700">{padronizar(novoNome)}</span></p>}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando || consultando}>Cancelar</AlertDialogCancel>
            {modoCnpj ? (
              tipoAba === 'pj' ? (
                <AlertDialogAction onClick={handleSalvarCnpj} disabled={salvando || !dadosCnpj} className="bg-green-600 hover:bg-green-700">
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </AlertDialogAction>
              ) : tipoAba === 'pf' ? (
                <AlertDialogAction onClick={handleSalvarPf} disabled={salvando || !nomePf.trim()} className="bg-green-600 hover:bg-green-700">
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </AlertDialogAction>
              ) : (
                <AlertDialogAction onClick={handleSalvarOutro} disabled={salvando || !novoNome.trim()} className="bg-green-600 hover:bg-green-700">
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </AlertDialogAction>
              )
            ) : (
              <AlertDialogAction onClick={handleSalvarOutro} disabled={salvando || !novoNome.trim()} className="bg-green-600 hover:bg-green-700">
                {salvando ? 'Salvando...' : 'Cadastrar'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}