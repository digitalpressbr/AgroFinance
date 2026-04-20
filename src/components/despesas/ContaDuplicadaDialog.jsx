import React from "react";
import { Edit, CalendarIcon, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ContaDuplicadaDialog({ contaDuplicada, onCancelar, onSalvarMesmo, onEditar, formatarDataSegura }) {
  if (!contaDuplicada) return null;

  const valorExistente = contaDuplicada.valor;
  const valorNovo = contaDuplicada._valorNovo;
  const valorDiferente = valorNovo !== undefined && Math.abs(valorNovo - valorExistente) > 0.01;

  return (
    <AlertDialog open={!!contaDuplicada} onOpenChange={(open) => !open && onCancelar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            ⚠️ Possível Conta Duplicada
          </AlertDialogTitle>
          <AlertDialogDescription>
            Já existe uma conta cadastrada com a <strong>mesma descrição e mesmo vencimento</strong>.
            {valorDiferente && (
              <span className="block mt-1 text-orange-700 font-medium">
                ⚠️ Os valores são diferentes — isso pode indicar uma duplicidade acidental.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          {/* Conta existente */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 space-y-1">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Conta já cadastrada</p>
              <h3 className="font-semibold text-gray-900">{contaDuplicada.descricao}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Venc. {formatarDataSegura(contaDuplicada.data_vencimento)}
                </span>
                <span className="font-semibold text-red-600">
                  💰 R$ {valorExistente?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {contaDuplicada.fornecedor && <span>🏢 {contaDuplicada.fornecedor}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Nova conta (se valor diferente) */}
          {valorDiferente && (
            <Card className="border-orange-300 bg-orange-50">
              <CardContent className="p-3 space-y-1">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Nova conta que você está cadastrando</p>
                <h3 className="font-semibold text-gray-900">{contaDuplicada.descricao}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Venc. {formatarDataSegura(contaDuplicada.data_vencimento)}
                  </span>
                  <span className="font-semibold text-orange-700">
                    💰 R$ {valorNovo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelar}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onEditar(contaDuplicada)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Existente
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onSalvarMesmo}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Cadastrar Mesmo Assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}