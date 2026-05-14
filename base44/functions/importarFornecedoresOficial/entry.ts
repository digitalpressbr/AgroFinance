// Importa lista oficial de fornecedores (CNPJ/CPF) + cria categorias simplificadas
// + migra ContaPagar.fornecedor/categoria com matching de alta confiança
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// =================================================================
// LISTA OFICIAL DE FORNECEDORES
// =================================================================
const FORNECEDORES_PJ = [
  { razao: 'Equatorial Goiás Distribuidora de Energia S.A.', cnpj: '01543032000104', categoria: 'Estrutura do Escritório', keywords: ['equatorial', 'energisa', 'enel goias', 'celg'] },
  { razao: 'Saneago - Saneamento de Goiás S.A.', cnpj: '01616929000102', categoria: 'Estrutura do Escritório', keywords: ['saneago', 'saneamento de goias'] },
  { razao: 'Oi S.A. (em Rec. Judicial)', cnpj: '76535764032851', categoria: 'Estrutura do Escritório', keywords: ['oi s.a', 'oi sa', 'telefone fixo oi'] },
  { razao: 'Brasoftware Informática Ltda', cnpj: '57142978000105', categoria: 'Tecnologia', keywords: ['brasoftware', 'microsoft 365', 'office 365'] },
  { razao: 'Allrede Participações Ltda', cnpj: '39998730000169', categoria: 'Estrutura do Escritório', keywords: ['allrede'] },
  { razao: 'Código X Country', cnpj: '12425261000132', categoria: 'Estrutura do Escritório', keywords: ['codigo x country', 'código x country', 'x country'] },
  { razao: 'CREA-GO', cnpj: '01619022000105', categoria: 'Anuidades e Conselhos', keywords: ['crea-go', 'crea go'] },
  { razao: 'CREA-MG', cnpj: '17254509000163', categoria: 'Anuidades e Conselhos', keywords: ['crea-mg', 'crea mg'] },
  { razao: 'CREA-MT', cnpj: '03471158000138', categoria: 'Anuidades e Conselhos', keywords: ['crea-mt', 'crea mt'] },
  { razao: 'CREA-TO', cnpj: '26753608000180', categoria: 'Anuidades e Conselhos', keywords: ['crea-to', 'crea to'] },
  { razao: 'CFTA - Conselho Federal Téc. Agrícolas', cnpj: '35438630000127', categoria: 'Anuidades e Conselhos', keywords: ['cfta', 'conselho federal tecnicos agricolas', 'conselho federal téc'] },
  { razao: 'JOAO VITOR DE ASSIS (MEI - Luciano)', cnpj: '59797150000110', categoria: 'Serviços Profissionais', keywords: ['joao vitor de assis', 'joão vitor', 'luciano mei', 'vigilancia luciano'] },
  { razao: 'Rubercy Julio Ferreira Camargo PJ', cnpj: '45976093000122', categoria: 'Tecnologia', keywords: ['rubercy', 'monica suporte', 'mônica suporte'] },
  { razao: 'Segfort Consultoria - Alex Caetano', cnpj: '30988410000153', categoria: 'Serviços Profissionais', keywords: ['segfort', 'alex caetano', 'sst alex'] },
  { razao: 'Contar Serviços Empresariais Ltda (Itumbiara)', cnpj: '03775427000150', categoria: 'Serviços Profissionais', keywords: ['contar servicos', 'contar serviços', 'contar itumbiara'] },
  { razao: 'Caixa Assistência Profissionais CREA', cnpj: '00509826001646', categoria: 'Anuidades e Conselhos', keywords: ['mutua crea', 'mútua crea', 'caixa assistencia crea'] },
  { razao: 'Aliança do Brasil Seguros (BB Seguros)', cnpj: '01378407000110', categoria: 'Seguros e Investimentos', keywords: ['alianca do brasil seguros', 'aliança do brasil seguros', 'bb seguros'] },
  { razao: 'Grupo Alfa Vigilância Patrimonial', cnpj: '43007135000191', categoria: 'Serviços Profissionais', keywords: ['grupo alfa vigilancia', 'grupo alfa vigilância', 'alfa vigilancia'] },
  { razao: 'Unidas - Cia. de Locação das Américas', cnpj: '10215988000160', categoria: 'Veículos', keywords: ['unidas locacao', 'unidas locação', 'cia de locacao das americas'] },
  { razao: 'Marques e Guerra Ltda', cnpj: '02149698000137', categoria: 'Veículos', keywords: ['marques e guerra', 'posto central'] },
  { razao: 'Auto Posto Bonssucesso Ltda', cnpj: '86841244000112', categoria: 'Veículos', keywords: ['auto posto bonssucesso', 'auto posto bonsucesso', 'posto bonsucesso', 'posto bonssucesso'] },
  { razao: 'Sicoob Administradora de Consórcios', cnpj: '16551061000187', categoria: 'Seguros e Investimentos', keywords: ['sicoob administradora de consorcios', 'sicoob consorcio', 'sicoob consórcio'] },
  { razao: 'BB Administradora de Consórcios', cnpj: '06043050000132', categoria: 'Seguros e Investimentos', keywords: ['bb administradora de consorcios', 'bb consorcio', 'bb consórcio'] },
  { razao: 'CONSEG Administradora de Consórcios', cnpj: '81742223000126', categoria: 'Veículos', keywords: ['conseg administradora', 'consorcio new holland', 'consórcio new holland', 'new holland'] },
  { razao: 'Caixa Capitalização S.A. (CapGanhador)', cnpj: '01599296000171', categoria: 'Seguros e Investimentos', keywords: ['caixa capitalizacao', 'caixa capitalização', 'capganhador'] },
  { razao: 'Ativos S.A. Securitizadora', cnpj: '05437257000129', categoria: 'Outros / Pontuais', keywords: ['ativos s.a. securitizadora', 'ativos sa securitizadora', 'acordo serasa', 'serasa acordo'] },
  { razao: 'Prefeitura de Bom Jesus de Goiás', cnpj: '01149624000138', categoria: 'Estrutura do Escritório', keywords: ['prefeitura de bom jesus', 'bom jesus de goias', 'alvara prefeitura', 'alvará prefeitura'] },
  { razao: 'Artes Melo', cnpj: '50438038000119', categoria: 'Serviços Profissionais', keywords: ['artes melo', 'fachada placa'] },
  { razao: 'Use Boletos / Zapinho', cnpj: '30881993000119', categoria: 'Outros / Pontuais', keywords: ['use boletos', 'zapinho', 'handchat'] },
  { razao: 'Cielo S.A.', cnpj: '01027058000191', categoria: 'Outros / Pontuais', keywords: ['cielo s.a', 'cielo sa', 'cielo acordo'] },
  { razao: 'Instituto Educação Norte GO', cnpj: '28492687000149', categoria: 'Outros / Pontuais', keywords: ['instituto educacao norte', 'instituto educação norte', 'curso isabela'] }
];

const FORNECEDORES_PF = [
  { nome: 'Nolberto Rodrigues Lopes', cpf: '41823869149', categoria: 'Estrutura do Escritório', keywords: ['nolberto', 'nolberto rodrigues'] },
  { nome: 'Giceli Rodrigues de Carvalho', cpf: '59537590615', categoria: 'Pessoal', keywords: ['giceli', 'giceli rodrigues'] }
];

const CATEGORIAS_NOVAS = [
  'Estrutura do Escritório',
  'Veículos',
  'Tecnologia',
  'Serviços Profissionais',
  'Anuidades e Conselhos',
  'Seguros e Investimentos',
  'Impostos e Tributos',
  'Pessoal',
  'Outros / Pontuais'
];

// =================================================================
// HELPERS
// =================================================================
function normalizar(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchPorKeywords(textoConta, keywords) {
  const norm = normalizar(textoConta);
  for (const kw of keywords) {
    if (norm.includes(normalizar(kw))) return true;
  }
  return false;
}

// =================================================================
// HANDLER
// =================================================================
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // padrão = true (preview)

    const relatorio = {
      dryRun,
      categorias: { criadas: [], existentes: [] },
      fornecedores: { criados: [], atualizados: [], existentes: [] },
      contas: { migradas: [], naoMigradas: [], totalAnalisadas: 0 }
    };

    // ============ 1. CATEGORIAS ============
    const todasCategorias = await base44.asServiceRole.entities.Categoria.list('', 500);
    const catsExistentesNorm = new Map(todasCategorias.map(c => [normalizar(c.nome), c]));

    for (const nomeCat of CATEGORIAS_NOVAS) {
      const existe = catsExistentesNorm.get(normalizar(nomeCat));
      if (existe) {
        relatorio.categorias.existentes.push(nomeCat);
      } else if (!dryRun) {
        await base44.asServiceRole.entities.Categoria.create({ nome: nomeCat, ativo: true });
        relatorio.categorias.criadas.push(nomeCat);
      } else {
        relatorio.categorias.criadas.push(nomeCat + ' (preview)');
      }
    }

    // ============ 2. FORNECEDORES ============
    const todosFornecedores = await base44.asServiceRole.entities.Fornecedor.list('', 1000);

    // Indexar fornecedores existentes por CNPJ, CPF e nome normalizado
    const forneceByCnpj = new Map();
    const forneceByCpf = new Map();
    const forneceByNome = new Map();
    for (const f of todosFornecedores) {
      if (f.cnpj) forneceByCnpj.set(String(f.cnpj).replace(/\D/g, ''), f);
      if (f.cpf) forneceByCpf.set(String(f.cpf).replace(/\D/g, ''), f);
      if (f.nome) forneceByNome.set(normalizar(f.nome), f);
    }

    // PJ
    for (const f of FORNECEDORES_PJ) {
      const cnpjLimpo = f.cnpj.replace(/\D/g, '');
      let existente = forneceByCnpj.get(cnpjLimpo) || forneceByNome.get(normalizar(f.razao));

      const dadosNovos = {
        nome: f.razao,
        tipo: 'pj',
        cnpj: cnpjLimpo,
        ativo: true
      };

      if (existente) {
        // Atualizar se faltar CNPJ ou tipo
        const precisaAtualizar = !existente.cnpj || existente.tipo !== 'pj' || existente.nome !== f.razao;
        if (precisaAtualizar) {
          if (!dryRun) {
            await base44.asServiceRole.entities.Fornecedor.update(existente.id, dadosNovos);
          }
          relatorio.fornecedores.atualizados.push({ nome: f.razao, cnpj: cnpjLimpo, id: existente.id });
        } else {
          relatorio.fornecedores.existentes.push({ nome: f.razao, cnpj: cnpjLimpo });
        }
      } else {
        if (!dryRun) {
          const novo = await base44.asServiceRole.entities.Fornecedor.create(dadosNovos);
          existente = novo;
        }
        relatorio.fornecedores.criados.push({ nome: f.razao, cnpj: cnpjLimpo });
      }
    }

    // PF
    for (const f of FORNECEDORES_PF) {
      const cpfLimpo = f.cpf.replace(/\D/g, '');
      let existente = forneceByCpf.get(cpfLimpo) || forneceByNome.get(normalizar(f.nome));

      const dadosNovos = {
        nome: f.nome,
        tipo: 'pf',
        cpf: cpfLimpo,
        ativo: true
      };

      if (existente) {
        const precisaAtualizar = !existente.cpf || existente.tipo !== 'pf' || existente.nome !== f.nome;
        if (precisaAtualizar) {
          if (!dryRun) {
            await base44.asServiceRole.entities.Fornecedor.update(existente.id, dadosNovos);
          }
          relatorio.fornecedores.atualizados.push({ nome: f.nome, cpf: cpfLimpo, id: existente.id });
        } else {
          relatorio.fornecedores.existentes.push({ nome: f.nome, cpf: cpfLimpo });
        }
      } else {
        if (!dryRun) {
          await base44.asServiceRole.entities.Fornecedor.create(dadosNovos);
        }
        relatorio.fornecedores.criados.push({ nome: f.nome, cpf: cpfLimpo });
      }
    }

    // ============ 3. MIGRAÇÃO DAS CONTAS ============
    // Buscar todas as contas (apenas do usuário admin atual via service role mas filtrando ativas)
    const todasContas = await base44.asServiceRole.entities.ContaPagar.list('', 5000);
    relatorio.contas.totalAnalisadas = todasContas.length;

    // Lista unificada para matching (PJ + PF)
    const todosFornecedoresLista = [
      ...FORNECEDORES_PJ.map(f => ({ nomeOficial: f.razao, categoria: f.categoria, keywords: f.keywords })),
      ...FORNECEDORES_PF.map(f => ({ nomeOficial: f.nome, categoria: f.categoria, keywords: f.keywords }))
    ];

    for (const conta of todasContas) {
      const textoBusca = `${conta.fornecedor || ''} ${conta.descricao || ''}`;
      const normBusca = normalizar(textoBusca);

      // Encontrar matches
      const matches = todosFornecedoresLista.filter(f => matchPorKeywords(normBusca, f.keywords));

      if (matches.length === 0) {
        relatorio.contas.naoMigradas.push({
          id: conta.id,
          fornecedor_atual: conta.fornecedor,
          descricao: conta.descricao,
          motivo: 'sem_match'
        });
        continue;
      }

      if (matches.length > 1) {
        relatorio.contas.naoMigradas.push({
          id: conta.id,
          fornecedor_atual: conta.fornecedor,
          descricao: conta.descricao,
          motivo: 'multiplos_matches',
          matches: matches.map(m => m.nomeOficial)
        });
        continue;
      }

      const match = matches[0];
      const fornecedorJaCorreto = conta.fornecedor === match.nomeOficial;

      // REGRA ESPECIAL: Mútua CREA → não força categoria (pode ser empréstimo OU anuidade)
      const ehMutua = match.keywords.some(k => k.includes('mutua') || k.includes('mútua'));
      const novaCategoria = ehMutua ? conta.categoria : match.categoria;
      const categoriaJaCorreta = conta.categoria === novaCategoria;

      if (fornecedorJaCorreto && categoriaJaCorreta) {
        // Nada a fazer
        continue;
      }

      const updates = {};
      if (!fornecedorJaCorreto) updates.fornecedor = match.nomeOficial;
      if (!categoriaJaCorreta && !ehMutua) updates.categoria = match.categoria;

      if (!dryRun && Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.ContaPagar.update(conta.id, updates);
      }

      relatorio.contas.migradas.push({
        id: conta.id,
        fornecedor_antes: conta.fornecedor,
        fornecedor_depois: updates.fornecedor || conta.fornecedor,
        categoria_antes: conta.categoria,
        categoria_depois: updates.categoria || conta.categoria,
        descricao: conta.descricao,
        mutua_categoria_preservada: ehMutua
      });
    }

    // Resumo
    relatorio.resumo = {
      categorias_criadas: relatorio.categorias.criadas.length,
      categorias_existentes: relatorio.categorias.existentes.length,
      fornecedores_criados: relatorio.fornecedores.criados.length,
      fornecedores_atualizados: relatorio.fornecedores.atualizados.length,
      fornecedores_existentes: relatorio.fornecedores.existentes.length,
      contas_total: relatorio.contas.totalAnalisadas,
      contas_migradas: relatorio.contas.migradas.length,
      contas_sem_match: relatorio.contas.naoMigradas.filter(c => c.motivo === 'sem_match').length,
      contas_multiplos_matches: relatorio.contas.naoMigradas.filter(c => c.motivo === 'multiplos_matches').length
    };

    return Response.json(relatorio);
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});