import { Parcela } from "@/entities/Parcela";
import { addMonths, addYears } from "date-fns";

/**
 * Monta a lista de parcelas calculadas a partir dos dados do projeto.
 * Mantém EXATAMENTE a mesma lógica de cálculo de datas e valores
 * usada anteriormente em NovoProjeto/EditarProjeto.
 */
function montarParcelasCalculadas(projetoId, dados) {
  const {
    valor_financiado,
    quantidade_parcelas,
    tipo_pagamento,
    data_primeira_parcela,
    tipo_calculo,
    parcelas_manuais,
    cronograma_automatico
  } = dados;

  if (!valor_financiado || !quantidade_parcelas) return [];

  const numParcelas = parseInt(quantidade_parcelas, 10);
  const novas = [];

  if (tipo_calculo === 'manual') {
    let currentParcelDate = data_primeira_parcela
      ? new Date(data_primeira_parcela + 'T00:00:00')
      : new Date();

    for (let i = 0; i < numParcelas; i++) {
      const parcelaManual = (parcelas_manuais && parcelas_manuais[i]) ? parcelas_manuais[i] : {};

      const dataVencimentoParaParcela = parcelaManual.data_vencimento
        ? parcelaManual.data_vencimento
        : currentParcelDate.toISOString().split('T')[0];

      novas.push({
        projeto_id: projetoId,
        numero_parcela: i + 1,
        data_vencimento: dataVencimentoParaParcela,
        valor_parcela: parseFloat(parcelaManual.valor || 0),
        status: "pendente",
        tipo_parcela: "manual"
      });

      if (tipo_pagamento === 'anual') {
        currentParcelDate = addYears(currentParcelDate, 1);
      } else {
        currentParcelDate = addMonths(currentParcelDate, 1);
      }
    }
  } else if (tipo_calculo === 'automatico' && cronograma_automatico && cronograma_automatico.length > 0) {
    for (const item of cronograma_automatico) {
      novas.push({
        projeto_id: projetoId,
        numero_parcela: item.numero,
        data_vencimento: item.data_vencimento,
        valor_parcela: parseFloat(item.valor),
        status: "pendente",
        tipo_parcela: item.tipo
      });
    }
  }

  return novas;
}

/**
 * Sincroniza as parcelas de um projeto de forma IDEMPOTENTE:
 * - faz UPSERT por numero_parcela (preservando data_pagamento e status das já pagas)
 * - PRUNE: remove parcelas existentes cujo numero_parcela não esteja no novo conjunto
 *
 * Chamar a mesma função duas vezes com os mesmos dados NÃO cria duplicatas.
 */
export async function sincronizarParcelas(projetoId, dados) {
  const novas = montarParcelasCalculadas(projetoId, dados);
  if (novas.length === 0) {
    // Sem dados suficientes para gerar — não mexe em nada.
    return;
  }

  const existentes = await Parcela.filter({ projeto_id: projetoId });
  const mapaExistentes = new Map(
    (existentes || []).map(p => [p.numero_parcela, p])
  );

  const numerosNovos = new Set(novas.map(n => n.numero_parcela));

  // 1) Upsert
  for (const nova of novas) {
    const existente = mapaExistentes.get(nova.numero_parcela);
    if (existente) {
      // Preserva pagamento já feito
      await Parcela.update(existente.id, {
        data_vencimento: nova.data_vencimento,
        valor_parcela: nova.valor_parcela,
        tipo_parcela: nova.tipo_parcela
      });
    } else {
      await Parcela.create(nova);
    }
  }

  // 2) Prune: remove parcelas existentes que não estão mais no novo conjunto
  for (const existente of existentes || []) {
    if (!numerosNovos.has(existente.numero_parcela)) {
      await Parcela.delete(existente.id);
    }
  }
}