import React from "react";
import { Edit, CalendarIcon } from "lucide-react";
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
  return (
    <AlertDialog open={!!contaDuplicada} onOpenChange={(open) => !open && onCancelar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
            ⚠️ Possível Conta Duplicada
          </AlertDialogTitle>
          <AlertDialogDescription>
            Já existe uma conta ativa com a mesma descrição e valor. Deseja cadastrar mesmo assim?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {contaDuplicada && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-gray-900">{contaDuplicada.descricao}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  Venc. {formatarDataSegura(contaDuplicada.data_vencimento)}
                </span>
                <span className="font-semibold text-red-600">
                  💰 R$ {contaDuplicada.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {contaDuplicada.recorrente && (
                  <span className="text-purple-600">
                    💳 Recorrente {contaDuplicada.parcela_atual}/{contaDuplicada.parcelas_total}
                  </span>
                )}
                {contaDuplicada.fornecedor && <span>🏢 {contaDuplicada.fornecedor}</span>}
              </div>
            </CardContent>
          </Card>
        )}

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