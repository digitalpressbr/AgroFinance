// Reconstrói entidades Fornecedor/Categoria a partir das contas existentes,
// já passando pelo LLM para canonicalizar. Faz tudo em uma chamada usando bulkCreate.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // 1. Carregar contas + entidades existentes
    const [contas, fornExistentes, catExistentes] = await Promise.all([
      base44.asServiceRole.entities.ContaPagar.list('', 5000),
      base44.asServiceRole.entities.Fornecedor.list('', 5000),
      base44.asServiceRole.entities.Categoria.list('', 5000)
    ]);

    // 2. Extrair nomes únicos das contas
    const nomesForn = [...new Set(contas.map(c => c.fornecedor).filter(Boolean).map(s => s.trim()))];
    const nomesCat = [...new Set(contas.map(c => c.categoria).filter(Boolean).map(s => s.trim()))];

    // 3. LLM para canonicalizar — em paralelo
    const promptF = `Liste canônica de FORNECEDORES de escritório de engenharia/agronomia brasileiro.

REGRAS:
- Unificar variações: "Crea-go"/"Crea-mg"/"Crea-to"/"Crea-go." → "CREA"
- "Receita Federal", "Simples Nacional / Receita Federal", "Receita Federal / Esocial" → "Receita Federal"
- Bancos com nome oficial limpo (Banco do Brasil, Caixa Econômica Federal, Itaú, Santander, C6 Bank)
- "Equatorial." → "Equatorial"
- Siglas MAIÚSCULAS (CREA, INSS, FGTS, SANEAGO)
- Sem pontuação no fim
- Pessoas (primeiro nome): mantém capitalizado

Lista atual: ${JSON.stringify(nomesForn)}

Retorne { "mapeamento": { "<atual>": "<canonico>" } } cobrindo TODOS.`;

    const promptC = `Liste canônica de CATEGORIAS de despesa profissionais.

REGRAS:
- "ART", "ART Taxas", "Taxa CREA", "Anuidade CREA", "Art." → "ART e Taxas CREA"
- "Cartão*", "Cartão crédito", "Cartão de crédito", "Cartão Pessoal" → "Cartão de Crédito"
- "Simples", "Simples.", "DAS", "Simples Nacional", "Impostos / Simples" → "Simples Nacional"
- "IPTU", "ITR", "DARF", "Imposto / Encargos Tributáveis" → "Impostos"
- "Impostos / FGTS" → "FGTS"; INSS → "INSS"
- Nomes de pessoas (Isabela, Luciano, Pessoal) → "Pessoal"
- "Combustível.", "Combustível" → "Combustível"
- "Escola", "Escolar" → "Educação"
- "Seguros de Veículo.", "Seguros de Veículo" → "Seguros de Veículo"
- Capitalização profissional, sem pontuação no fim

Lista atual: ${JSON.stringify(nomesCat)}

Retorne { "mapeamento": { "<atual>": "<canonico>" } } cobrindo TODOS.`;

    const [respF, respC] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: promptF,
        response_json_schema: {
          type: 'object',
          properties: { mapeamento: { type: 'object', additionalProperties: { type: 'string' } } },
          required: ['mapeamento']
        }
      }),
      base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: promptC,
        response_json_schema: {
          type: 'object',
          properties: { mapeamento: { type: 'object', additionalProperties: { type: 'string' } } },
          required: ['mapeamento']
        }
      })
    ]);

    const mapForn = respF.mapeamento || {};
    const mapCat = respC.mapeamento || {};

    // 4. Atualizar contas (batches de 5 em paralelo)
    const contasParaAtualizar = [];
    for (const c of contas) {
      const updates = {};
      if (c.fornecedor && mapForn[c.fornecedor] && mapForn[c.fornecedor] !== c.fornecedor) {
        updates.fornecedor = mapForn[c.fornecedor];
      }
      if (c.categoria && mapCat[c.categoria] && mapCat[c.categoria] !== c.categoria) {
        updates.categoria = mapCat[c.categoria];
      }
      if (Object.keys(updates).length > 0) contasParaAtualizar.push({ id: c.id, updates });
    }

    let contasAtualizadas = 0;
    for (let i = 0; i < contasParaAtualizar.length; i += 5) {
      const batch = contasParaAtualizar.slice(i, i + 5);
      await Promise.all(batch.map(({ id, updates }) =>
        base44.asServiceRole.entities.ContaPagar.update(id, updates).then(() => contasAtualizadas++)
      ));
      await sleep(60);
    }

    // 5. Apagar entidades existentes (em paralelo batches de 5)
    for (let i = 0; i < fornExistentes.length; i += 5) {
      const batch = fornExistentes.slice(i, i + 5);
      await Promise.all(batch.map(f => base44.asServiceRole.entities.Fornecedor.delete(f.id)));
      await sleep(60);
    }
    for (let i = 0; i < catExistentes.length; i += 5) {
      const batch = catExistentes.slice(i, i + 5);
      await Promise.all(batch.map(c => base44.asServiceRole.entities.Categoria.delete(c.id)));
      await sleep(60);
    }

    // 6. Criar entidades canônicas (bulkCreate)
    const canonicasForn = [...new Set(Object.values(mapForn).filter(Boolean))].sort();
    const canonicasCat = [...new Set(Object.values(mapCat).filter(Boolean))].sort();

    if (canonicasForn.length > 0) {
      await base44.asServiceRole.entities.Fornecedor.bulkCreate(
        canonicasForn.map(nome => ({ nome, ativo: true }))
      );
    }
    if (canonicasCat.length > 0) {
      await base44.asServiceRole.entities.Categoria.bulkCreate(
        canonicasCat.map(nome => ({ nome, ativo: true }))
      );
    }

    return Response.json({
      success: true,
      fornecedores_finais: canonicasForn,
      categorias_finais: canonicasCat,
      contas_atualizadas: contasAtualizadas,
      mapForn,
      mapCat
    });
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});