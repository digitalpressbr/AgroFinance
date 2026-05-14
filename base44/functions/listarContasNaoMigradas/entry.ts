import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Categorias OFICIAIS (criadas pela importação)
    const CATEGORIAS_OFICIAIS = new Set([
      'estrutura do escritório',
      'veículos',
      'tecnologia',
      'serviços profissionais',
      'anuidades e conselhos',
      'seguros e investimentos',
      'impostos e tributos',
      'pessoal',
      'outros / pontuais'
    ]);

    const contas = await base44.asServiceRole.entities.ContaPagar.list('', 5000);

    // Agrupa por fornecedor atual — não migrada = categoria ainda não está na lista oficial
    const grupos = {};
    for (const c of contas) {
      const catNorm = (c.categoria || '').toLowerCase().trim();
      if (CATEGORIAS_OFICIAIS.has(catNorm)) continue; // já migrada

      const forn = (c.fornecedor || '(sem fornecedor)').trim();
      if (!grupos[forn]) grupos[forn] = { quantidade: 0, categorias: new Set(), exemplos: [] };
      grupos[forn].quantidade += 1;
      if (c.categoria) grupos[forn].categorias.add(c.categoria);
      if (grupos[forn].exemplos.length < 3) {
        grupos[forn].exemplos.push(c.descricao || '');
      }
    }

    const resultado = Object.entries(grupos)
      .map(([fornecedor, info]) => ({
        fornecedor,
        quantidade: info.quantidade,
        categorias: Array.from(info.categorias),
        exemplos: info.exemplos
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    return Response.json({
      total_grupos: resultado.length,
      total_contas_nao_migradas: resultado.reduce((s, g) => s + g.quantidade, 0),
      grupos: resultado
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});