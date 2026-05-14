import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Padronização: primeira letra maiúscula, restante minúsculo; siglas conhecidas em MAIÚSCULO
const SIGLAS = new Set([
  'PIX', 'IOF', 'IPVA', 'IPTU', 'ITR', 'IR', 'INSS', 'FGTS', 'ICMS', 'ISS',
  'SANEAGO', 'CELG', 'CEMIG', 'SAAE', 'CPFL', 'CCR', 'CRT', 'CRV',
  'BB', 'CEF', 'BV', 'BTG', 'XP', 'C6', 'PJ', 'PF', 'S.A.', 'SA', 'LTDA', 'ME', 'EPP', 'EIRELI',
  'TV', 'NET', 'GNV', 'GLP', 'KM'
]);

const PREP = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'para', 'por', 'com', 'sem', 'a', 'o']);

function padronizarNome(raw) {
  if (!raw) return '';
  const limpo = String(raw).trim().replace(/\s+/g, ' ');
  if (!limpo) return '';

  const palavras = limpo.split(' ');
  const resultado = palavras.map((palavra, idx) => {
    if (!palavra) return palavra;

    // Verifica se é sigla conhecida (case-insensitive)
    const upper = palavra.toUpperCase();
    if (SIGLAS.has(upper)) return upper;

    // Se já tem mistura tipo "S.A." ou "S/A"
    if (/^[A-Z]\.([A-Z]\.?)+$/i.test(palavra)) return palavra.toUpperCase();

    // Se é toda em MAIÚSCULA e tem 2-4 letras, provavelmente sigla
    if (palavra.length <= 4 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]+$/.test(palavra)) return upper;

    // Preposição em meio do nome → minúsculo (mas não na primeira posição)
    const lower = palavra.toLowerCase();
    if (idx > 0 && PREP.has(lower)) return lower;

    // Caso geral: primeira maiúscula, resto minúsculo
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  return resultado.join(' ');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Carregar todas as contas
    const contas = await base44.asServiceRole.entities.ContaPagar.list('', 5000);

    // 2. Extrair valores únicos brutos
    const fornecedoresBrutos = new Map(); // chaveLower -> { padronizado, originais: Set }
    const categoriasBrutas = new Map();

    for (const c of contas) {
      if (c.fornecedor && c.fornecedor.trim()) {
        const padr = padronizarNome(c.fornecedor);
        const key = padr.toLowerCase();
        if (!fornecedoresBrutos.has(key)) {
          fornecedoresBrutos.set(key, { padronizado: padr, originais: new Set() });
        }
        fornecedoresBrutos.get(key).originais.add(c.fornecedor);
      }
      if (c.categoria && c.categoria.trim()) {
        const padr = padronizarNome(c.categoria);
        const key = padr.toLowerCase();
        if (!categoriasBrutas.has(key)) {
          categoriasBrutas.set(key, { padronizado: padr, originais: new Set() });
        }
        categoriasBrutas.get(key).originais.add(c.categoria);
      }
    }

    // 3. Lista padrão obrigatória (apenas categorias — fornecedores vêm dos dados)
    const categoriasPadrao = [
      'Energia', 'Água', 'Internet', 'Telefone', 'Combustível',
      'Banco', 'Cartão', 'Impostos', 'Aluguel', 'Condomínio',
      'Manutenção', 'Material', 'Serviços', 'Funcionários', 'Outros'
    ];
    for (const cat of categoriasPadrao) {
      const key = cat.toLowerCase();
      if (!categoriasBrutas.has(key)) {
        categoriasBrutas.set(key, { padronizado: cat, originais: new Set() });
      }
    }

    // 4. Buscar fornecedores/categorias já cadastrados (evitar duplicar)
    const fornecedoresExistentes = await base44.asServiceRole.entities.Fornecedor.list('', 5000);
    const categoriasExistentes = await base44.asServiceRole.entities.Categoria.list('', 5000);
    const setFornExist = new Set(fornecedoresExistentes.map(f => f.nome.toLowerCase()));
    const setCatExist = new Set(categoriasExistentes.map(c => c.nome.toLowerCase()));

    // 5. Criar entidades faltantes
    let criadosForn = 0;
    for (const [key, { padronizado }] of fornecedoresBrutos) {
      if (!setFornExist.has(key)) {
        await base44.asServiceRole.entities.Fornecedor.create({ nome: padronizado, ativo: true });
        criadosForn++;
      }
    }

    let criadasCat = 0;
    for (const [key, { padronizado }] of categoriasBrutas) {
      if (!setCatExist.has(key)) {
        await base44.asServiceRole.entities.Categoria.create({ nome: padronizado, ativo: true });
        criadasCat++;
      }
    }

    // 6. Atualizar contas existentes para usar nomes padronizados (somente onde mudou)
    let contasAtualizadas = 0;
    for (const c of contas) {
      const updates = {};
      if (c.fornecedor && c.fornecedor.trim()) {
        const padr = padronizarNome(c.fornecedor);
        if (padr !== c.fornecedor) updates.fornecedor = padr;
      }
      if (c.categoria && c.categoria.trim()) {
        const padr = padronizarNome(c.categoria);
        if (padr !== c.categoria) updates.categoria = padr;
      }
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.ContaPagar.update(c.id, updates);
        contasAtualizadas++;
      }
    }

    return Response.json({
      success: true,
      fornecedores_criados: criadosForn,
      categorias_criadas: criadasCat,
      contas_atualizadas: contasAtualizadas,
      total_fornecedores: fornecedoresBrutos.size,
      total_categorias: categoriasBrutas.size
    });
  } catch (error) {
    console.error('Erro na migração:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});