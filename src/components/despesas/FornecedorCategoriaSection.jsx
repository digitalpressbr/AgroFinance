import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tag } from "lucide-react";
import FornecedorCombobox from "./FornecedorCombobox";
import { sugerirCategoria } from "./sugerirCategoria";

export default function FornecedorCategoriaSection({
  formDataConta,
  setFormDataConta,
  fornecedores,
  setFornecedores,
  categorias,
}) {
  const [categoriaFoiSugerida, setCategoriaFoiSugerida] = useState(false);
  const [privadoFoiSugerido, setPrivadoFoiSugerido] = useState(false);
  const [motivoSugestao, setMotivoSugestao] = useState("");

  const handleFornecedorChange = (v) => {
    const fornObj = fornecedores.find(f => f.nome === v);
    const sug = sugerirCategoria(fornObj, formDataConta.descricao);
    setFormDataConta(prev => ({
      ...prev,
      fornecedor: v,
      ...(sug ? { categoria: sug.categoria, privado: sug.privado } : {})
    }));
    if (sug) {
      setCategoriaFoiSugerida(true);
      setPrivadoFoiSugerido(true);
      setMotivoSugestao(sug.motivo);
    } else {
      setCategoriaFoiSugerida(false);
      setPrivadoFoiSugerido(false);
      setMotivoSugestao("");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FornecedorCombobox
            value={formDataConta.fornecedor}
            onChange={handleFornecedorChange}
            fornecedores={fornecedores}
            onFornecedorCriado={(novo) => setFornecedores(prev => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)))}
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-600" />
            Categoria
            {categoriaFoiSugerida && motivoSugestao && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 cursor-help">✨ Sugerido</Badge>
                  </TooltipTrigger>
                  <TooltipContent>Sugerido pela regra: {motivoSugestao}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Label>
          <Select
            value={formDataConta.categoria || ""}
            onValueChange={(v) => {
              setFormDataConta({ ...formDataConta, categoria: v });
              setCategoriaFoiSugerida(false);
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.filter(c => c.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome)).map(c => (
                <SelectItem key={c.id || c.nome} value={c.nome}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="privado-conta"
          checked={formDataConta.privado || false}
          onChange={(e) => {
            setFormDataConta({ ...formDataConta, privado: e.target.checked });
            setPrivadoFoiSugerido(false);
          }}
          className="w-4 h-4"
        />
        <Label htmlFor="privado-conta" className="cursor-pointer flex items-center gap-2">
          Despesa privada
          {privadoFoiSugerido && formDataConta.privado && motivoSugestao && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 cursor-help">✨ Sugerido</Badge>
                </TooltipTrigger>
                <TooltipContent>Sugerido pela regra: {motivoSugestao}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
      </div>
    </>
  );
}