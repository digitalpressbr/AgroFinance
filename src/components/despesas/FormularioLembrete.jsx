import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AutocompleteInput from "../common/AutocompleteInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FormularioLembrete({
  editingItem,
  formDataLembrete,
  setFormDataLembrete,
  handleSubmitLembrete,
  handleValorChange,
  handleCorrecaoOrtografica,
  corrigindoTexto,
  sugestoes,
  enviarTesteWhatsAppLembrete,
  enviandoTeste,
  handleCancelar
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {editingItem ? "Editar Lembrete" : "Novo Lembrete"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitLembrete} className="space-y-4">
          <div>
            <Label>Descrição *</Label>
            <AutocompleteInput value={formDataLembrete.descricao} onChange={(e) => setFormDataLembrete({...formDataLembrete, descricao: e.target.value})} onBlur={() => handleCorrecaoOrtografica('descricao', 'lembrete')} placeholder="Ex: Consórcio - Encerramento do Grupo" suggestions={sugestoes.descricoes} required disabled={corrigindoTexto.descricao} />
            {corrigindoTexto.descricao && <p className="text-xs text-blue-600 mt-1">✨ Corrigindo...</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Valor (R$)</Label>
              <Input value={formDataLembrete.valor} onChange={(e) => handleValorChange(e.target.value, 'lembrete')} placeholder="0,00" className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Data do Evento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start text-left font-normal h-9 ${!formDataLembrete.data_evento && "text-muted-foreground"}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formDataLembrete.data_evento ? format(new Date(formDataLembrete.data_evento + 'T00:00:00'), 'dd/MM/yyyy') : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" locale={ptBR} selected={formDataLembrete.data_evento ? new Date(formDataLembrete.data_evento + 'T00:00:00') : undefined} onSelect={(date) => { if (!date) return; setFormDataLembrete({...formDataLembrete, data_evento: format(date, 'yyyy-MM-dd')}); }} disabled={(date) => { const hoje = new Date(); hoje.setHours(0,0,0,0); return date < hoje; }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Hora (⏰ Aviso 10min antes)</Label>
              <Input type="time" value={formDataLembrete.hora_evento} onChange={(e) => setFormDataLembrete({...formDataLembrete, hora_evento: e.target.value})} placeholder="HH:MM" className="h-9" />
            </div>
          </div>
          <div>
            <Label>Link de Acesso da Live/Evento</Label>
            <Input type="url" value={formDataLembrete.link_acesso} onChange={(e) => setFormDataLembrete({...formDataLembrete, link_acesso: e.target.value})} placeholder="https://..." />
            <p className="text-xs text-gray-500 mt-1">🔗 Será incluído no WhatsApp</p>
          </div>
          <div className="border rounded-lg p-3 bg-purple-50">
            <Label className="text-sm font-semibold text-purple-900 mb-2 block">⏰ Aviso Extra (Opcional)</Label>
            <Select value={formDataLembrete.aviso_extra_minutos ? String(formDataLembrete.aviso_extra_minutos) : "nenhum"} onValueChange={(value) => setFormDataLembrete({...formDataLembrete, aviso_extra_minutos: value === "nenhum" ? null : parseInt(value)})}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Nenhum aviso extra" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum (só 10min antes)</SelectItem>
                <SelectItem value="30">⏰ 30 minutos antes</SelectItem>
                <SelectItem value="60">⏰ 1 hora antes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-2">💡 Além do aviso fixo de 10 minutos antes, você pode configurar um aviso extra</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Avisar quantos dias antes? *</Label>
              <Input type="number" min="1" max="365" value={formDataLembrete.dias_antes_avisar} onChange={(e) => setFormDataLembrete({...formDataLembrete, dias_antes_avisar: e.target.value})} required className="h-9 w-20" />
              <p className="text-xs text-gray-500 mt-1">Aviso X dias antes (09h) + 10min antes + {formDataLembrete.aviso_extra_minutos ? (formDataLembrete.aviso_extra_minutos >= 60 ? '1h antes' : `${formDataLembrete.aviso_extra_minutos}min antes`) : 'nenhum extra'}</p>
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={formDataLembrete.observacoes} onChange={(e) => setFormDataLembrete({...formDataLembrete, observacoes: e.target.value})} onBlur={() => handleCorrecaoOrtografica('observacoes', 'lembrete')} rows={3} disabled={corrigindoTexto.observacoes} />
            {corrigindoTexto.observacoes && <p className="text-xs text-blue-600 mt-1">✨ Corrigindo...</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ativo-lembrete" checked={formDataLembrete.ativo} onChange={(e) => setFormDataLembrete({...formDataLembrete, ativo: e.target.checked})} className="w-4 h-4" />
            <Label htmlFor="ativo-lembrete" className="cursor-pointer">Ativo (receberá notificações)</Label>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="bg-green-600 hover:bg-green-700">{editingItem ? "Atualizar" : "Cadastrar"}</Button>
            <Button type="button" variant="outline" onClick={enviarTesteWhatsAppLembrete} disabled={!formDataLembrete.telefone_contato || enviandoTeste} className="border-blue-600 text-blue-600 hover:bg-blue-50">{enviandoTeste ? "Enviando..." : "📱 Testar"}</Button>
            <Button type="button" variant="outline" onClick={handleCancelar}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}