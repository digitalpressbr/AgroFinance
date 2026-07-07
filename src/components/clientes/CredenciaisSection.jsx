import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    const novas = credenciais.map((c, i) => {
      if (i !== idx) return c;
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

  // Detecta se ALGUMA linha está no modo "Outro" para alinhar os cabeçalhos corretamente
  const algumaOutro = credenciais.some(c => c.plataforma === "Outro");

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-green-100">
        Acessos e Credenciais
      </h3>
      <p className="text-xs text-amber-700 bg-amber-50 py-2 px-3 rounded-md mb-3 border border-amber-200">
        🔒 <strong>Informação Sensível:</strong> Estes dados são criptografados e protegidos. Use apenas para finalidades autorizadas.
      </p>

      {credenciais.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-2">
          Nenhuma credencial cadastrada. Clique em "Adicionar credencial" para começar.
        </p>
      ) : (
        <>
          {/* Cabeçalhos de coluna — visíveis apenas em md+ */}
          <div className="hidden md:grid grid-cols-12 gap-2 items-center px-2 mb-1">
            <div className={algumaOutro ? "col-span-2" : "col-span-3"}>
              <span className="text-xs font-medium text-muted-foreground">Plataforma</span>
            </div>
            {algumaOutro && (
              <div className="col-span-3">
                <span className="text-xs font-medium text-muted-foreground">Nome</span>
              </div>
            )}
            <div className={algumaOutro ? "col-span-4" : "col-span-6"}>
              <span className="text-xs font-medium text-muted-foreground">Login</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Senha</span>
            </div>
            <div className="col-span-1" />
          </div>

          <div className="space-y-2">
            {credenciais.map((cred, idx) => {
              const isOutro = cred.plataforma === "Outro";
              const hidden = hiddenPasswords[idx];
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 rounded-md hover:bg-gray-50 border border-gray-100"
                >
                  {/* Plataforma */}
                  <div className={isOutro ? "md:col-span-2" : "md:col-span-3"}>
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

                  {/* Nome customizado quando "Outro" */}
                  {isOutro && (
                    <div className="md:col-span-3">
                      <Input
                        value={cred.plataforma_custom || ""}
                        onChange={(e) => handleFieldChange(idx, 'plataforma_custom', e.target.value)}
                        placeholder="Nome da plataforma"
                        className="h-9 text-sm"
                      />
                    </div>
                  )}

                  {/* Login */}
                  <div className={isOutro ? "md:col-span-4" : "md:col-span-6"}>
                    <Input
                      value={cred.login || ""}
                      onChange={(e) => handleFieldChange(idx, 'login', e.target.value)}
                      placeholder="usuário / e-mail / CPF"
                      className="h-9 text-sm"
                      maxLength={120}
                      autoComplete="off"
                    />
                  </div>

                  {/* Senha com olho embutido */}
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Input
                        type={hidden ? "password" : "text"}
                        value={cred.senha || ""}
                        onChange={(e) => handleFieldChange(idx, 'senha', e.target.value)}
                        placeholder="Senha"
                        className="h-9 text-sm pr-8"
                        maxLength={120}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShow(idx)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded"
                        title={hidden ? "Mostrar senha" : "Ocultar senha"}
                      >
                        {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Lixeira */}
                  <div className="md:col-span-1 flex md:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerLinha(idx)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Remover credencial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={adicionarLinha}
        className="mt-3 h-8 border-green-300 text-green-700 hover:bg-green-50"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Adicionar credencial
      </Button>

      <p className="text-xs text-gray-500 mt-3 py-2 px-3 bg-gray-50 rounded-md">
        ℹ️ <strong>Nota de Segurança:</strong> Todos os campos de senha são opcionais e serão criptografados no banco de dados. Estas informações são confidenciais e devem ser tratadas com máximo cuidado.
      </p>
    </div>
  );
}