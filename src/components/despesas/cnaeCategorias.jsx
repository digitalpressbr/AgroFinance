// Mapeamento CNAE → Categorias sugeridas
// Os 4 primeiros dígitos do CNAE identificam a atividade principal
// Fonte: classificação oficial IBGE

const MAPA = {
  // Combustíveis
  '4731': ['Combustível'],
  '4732': ['Combustível'],
  // Energia elétrica
  '3511': ['Energia Elétrica'],
  '3512': ['Energia Elétrica'],
  '3513': ['Energia Elétrica'],
  '3514': ['Energia Elétrica'],
  // Água e saneamento
  '3600': ['Água', 'Saneamento'],
  '3700': ['Saneamento'],
  // Telecomunicações / Internet
  '6110': ['Telefone', 'Internet'],
  '6120': ['Telefone'],
  '6130': ['Internet', 'Telefone'],
  '6141': ['Internet'],
  '6142': ['Internet'],
  '6143': ['Internet'],
  '6190': ['Internet', 'Telefone'],
  // Bancos / Financeiro
  '6422': ['Bancos', 'Tarifas Bancárias'],
  '6491': ['Financiamento', 'Empréstimo'],
  '6493': ['Consórcio'],
  '6499': ['Financeiro'],
  '6512': ['Seguros'],
  '6520': ['Seguros'],
  // Supermercado / Mercearia
  '4711': ['Mercado', 'Alimentação'],
  '4712': ['Mercado', 'Alimentação'],
  '4721': ['Alimentação'],
  '4722': ['Açougue', 'Alimentação'],
  // Padaria
  '1091': ['Padaria', 'Alimentação'],
  // Farmácia / Saúde
  '4771': ['Farmácia', 'Saúde'],
  '4772': ['Farmácia'],
  '8610': ['Saúde', 'Hospital'],
  '8620': ['Saúde'],
  '8630': ['Saúde', 'Consulta Médica'],
  '8640': ['Exames', 'Saúde'],
  '8650': ['Saúde'],
  '8660': ['Saúde'],
  '8690': ['Saúde'],
  // Educação
  '8511': ['Educação'],
  '8512': ['Educação'],
  '8513': ['Educação'],
  '8520': ['Educação'],
  '8531': ['Educação', 'Faculdade'],
  '8532': ['Educação', 'Faculdade'],
  '8533': ['Educação', 'Faculdade'],
  '8541': ['Educação', 'Cursos'],
  '8542': ['Educação', 'Cursos'],
  '8550': ['Educação'],
  '8591': ['Educação', 'Cursos'],
  '8592': ['Educação', 'Cursos'],
  '8593': ['Educação', 'Cursos'],
  '8599': ['Educação', 'Cursos'],
  // Veículos
  '4511': ['Veículos'],
  '4512': ['Veículos'],
  '4520': ['Manutenção Veículo', 'Oficina'],
  '4530': ['Peças Automotivas'],
  '4541': ['Veículos', 'Motos'],
  '4542': ['Motos'],
  '4543': ['Manutenção Veículo'],
  // Restaurantes / Lanchonetes
  '5611': ['Restaurante', 'Alimentação'],
  '5612': ['Alimentação'],
  '5620': ['Alimentação'],
  // Insumos agrícolas (importante pro AgroFinance)
  '4623': ['Insumos Agrícolas', 'Agropecuária'],
  '4661': ['Máquinas Agrícolas'],
  '4683': ['Insumos Agrícolas'],
  '4684': ['Insumos Agrícolas'],
  '4689': ['Insumos Agrícolas'],
  '0161': ['Serviços Agrícolas'],
  '0162': ['Serviços Agropecuários'],
  // Construção / Materiais
  '4744': ['Material de Construção'],
  '4741': ['Material de Construção'],
  '4742': ['Material de Construção'],
  '4743': ['Material de Construção'],
  '4313': ['Mão de Obra', 'Construção'],
  '4321': ['Elétrica', 'Construção'],
  '4322': ['Encanador', 'Construção'],
  // Contábil / Advocacia / Serviços profissionais
  '6920': ['Contador', 'Honorários'],
  '6911': ['Advogado', 'Honorários'],
  '7020': ['Consultoria'],
  '7112': ['Engenharia', 'Honorários'],
  '7119': ['Engenharia'],
  // TI / Software
  '6201': ['Software', 'TI'],
  '6202': ['Software', 'TI'],
  '6203': ['Software', 'TI'],
  '6209': ['TI'],
  '6311': ['Hospedagem', 'TI'],
  '6319': ['TI'],
  // Limpeza / Serviços
  '8121': ['Limpeza'],
  '8122': ['Limpeza'],
  '8129': ['Limpeza'],
  // Vestuário
  '4781': ['Vestuário'],
  '4782': ['Vestuário', 'Calçados'],
  // Móveis / Eletro
  '4753': ['Eletrônicos'],
  '4754': ['Móveis'],
  '4755': ['Loja'],
  '4756': ['Loja'],
  '4757': ['Loja'],
  '4759': ['Loja']
};

// Heurística por palavras-chave (fallback se CNAE não bater)
const PALAVRAS_CHAVE = [
  { regex: /\b(posto|combust[íi]vel|petrobr|ipiranga|shell|raizen)\b/i, cats: ['Combustível'] },
  { regex: /\b(energisa|enel|cemig|cpfl|elektro|coelba|celpe|light|equatorial|copel|celesc)\b/i, cats: ['Energia Elétrica'] },
  { regex: /\b(saneago|sabesp|cedae|copasa|caesb|sanepar|corsan|caern|embasa)\b/i, cats: ['Água'] },
  { regex: /\b(vivo|claro|tim|oi|nextel|algar|sercomtel)\b/i, cats: ['Telefone', 'Internet'] },
  { regex: /\b(banco|ita[úu]|bradesco|santander|caixa|nubank|inter|sicredi|sicoob|bb)\b/i, cats: ['Bancos'] }
];

export function sugerirCategorias(cnae, razaoSocial = '') {
  const sugestoes = new Set();

  // 1. Tentar por CNAE (4 primeiros dígitos)
  if (cnae) {
    const codigo = String(cnae).replace(/\D/g, '').slice(0, 4);
    if (MAPA[codigo]) {
      MAPA[codigo].forEach(c => sugestoes.add(c));
    }
  }

  // 2. Fallback: palavras-chave no nome
  if (sugestoes.size === 0 && razaoSocial) {
    for (const { regex, cats } of PALAVRAS_CHAVE) {
      if (regex.test(razaoSocial)) {
        cats.forEach(c => sugestoes.add(c));
        break;
      }
    }
  }

  return Array.from(sugestoes);
}