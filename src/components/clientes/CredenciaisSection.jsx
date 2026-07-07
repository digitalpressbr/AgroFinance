import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";

const PLATAFORMAS = [
  "E-mail pessoal",
  "Registro Ambiental",
  "E-AGRO",
  "SIDAGO/Agrodefesa",
  "Gov.br",
  "Banco",
  "Prefeitura",
  "INCRA",
  "Receita Federal",
  "Outro"
];

export default function CredenciaisSection({ credenciais, onChange }) {
  // Senhas começam VISÍVEIS por padrão. Só ficam ocultas quando o usuário clica no olho.
  const [hiddenPasswords, setHiddenPasswords] = useState({});

  const toggleShow = (idx) => {
    setHiddenPasswords(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleFieldChange = (idx, field, value) => {
    const novas = credenciais.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    onChange(novas);
  };

  const handlePlataformaChange = (idx, value) => {
    // Ao trocar para algo diferente de "Outro", limpa o nome livre
    const novas = credenciais.map((c, i) => {
      if (i !== idx) return c;
      if (value === "Outro") {
        return { ...c, plataforma: value };
      }
      return { ...c, plataforma: value };
    });
    onChange(novas);
  };

  const adicionarLinha = () => {
    onChange([...credenciais, { plataforma: "", login: "", senha: "" }]);
  };

  const removerLinha = (idx) => {
    onChange(credenciais.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-green-100">
        Acessos e Credenciais
      </h3>
      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mb-4 border border-amber-200">
        🔒 <strong>Informação Sensível:</strong> Estes dados são criptografados e protegidos. Use apenas para finalidades autorizadas.
      </p>

      <div className="space-y-2">
        {credenciais.length === 0 && (
          <p className="text-sm text-gray-500 italic py-2">
            Nenhuma credencial cadastrada. Clique em "Adicionar credencial" para começar.
          </p>
        )}

        {credenciais.map((cred, idx) => {
          const isOutro = cred.plataforma === "Outro";
          return (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 items-end p-2 rounded-md hover:bg-gray-50 border border-gray-100"
            >
              {/* Plataforma */}
              <div className={isOutro ? "col-span-12 md:col-span-3" : "col-span-12 md:col-span-4"}>
                {idx === 0 && <Label className="text-xs text-gray-600 font-medium mb-1 block">Plataforma</Label>}
                <Select
                  value={cred.plataforma || ""}
                  onValueChange={(v) => handlePlataformaChange(idx, v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATAFORMAS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo livre quando "Outro" */}
              {isOutro && (
                <div className="col-span-12 md:col-span-3">
                  {idx === 0 && <Label className="text-xs text-gray-600 font-medium mb-1 block">Nome</Label>}
                  <Input
                    value={cred.plataforma_custom || ""}
                    onChange={(e) => handleFieldChange(idx, 'plataforma_custom', e.target.value)}
                    placeholder="Nome da plataforma"
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {/* Login */}
              <div className={isOutro ? "col-span-6 md:col-span-3" : "col-span-6 md:col-span-4"}>
                {idx === 0 && <Label className="text-xs text-gray-600 font-medium mb-1 block">Login</Label>}
                <Input
                  value={cred.login || ""}
                  onChange={(e) => handleFieldChange(idx, 'login', e.target.value)}
                  placeholder="usuário / e-mail / CPF"
                  className="h-9 text-sm"
                  maxLength={120}
                />
              </div>

              {/* Senha */}
              <div className={isOutro ? "col-span-5 md:col-span-2" : "col-span-5 md:col-span-3"}>
                {idx === 0 && <Label className="text-xs text-gray-600 font-medium mb-1 block">Senha</Label>}
                <div className="flex gap-1">
                  <Input
                    type={hiddenPasswords[idx] ? "password" : "text"}
                    value={cred.senha || ""}
                    onChange={(e) => handleFieldChange(idx, 'senha', e.target.value)}
                    placeholder="Senha"
                    className="h-9 text-sm"
                    maxLength={120}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleShow(idx)}
                    className="h-9 w-9 shrink-0"
                    title={hiddenPasswords[idx] ? "Mostrar senha" : "Ocultar senha"}
                  >
                    {hiddenPasswords[idx] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Botão remover */}
              <div className="col-span-1 flex justify-end">
                {idx === 0 && <div className="h-5" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerLinha(idx)}
                  className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Remover credencial"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={adicionarLinha}
        className="mt-3 border-green-300 text-green-700 hover:bg-green-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar credencial
      </Button>

      <p className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
        ℹ️ <strong>Nota de Segurança:</strong> Todos os campos de senha são opcionais e serão criptografados no banco de dados.
        Estas informações são confidenciais e devem ser tratadas com máximo cuidado.
      </p>
    </div>
  );
}