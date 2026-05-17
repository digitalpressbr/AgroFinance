// Sugere categoria + flag privado com base no fornecedor e descrição.
// Retorna { categoria, privado, motivo } ou null.
export function sugerirCategoria(fornecedorObj, descricao) {
  const nome = (fornecedorObj?.nome || '').toLowerCase();
  const desc = (descricao || '').toLowerCase();
  const contemArt = /\bart\b|art-|art–/.test(desc);
  const contemAnuid = desc.includes('anuidade');

  // a) CREA/CFTA + ART → ART reembolsável
  if ((nome.includes('crea-') || nome.includes('cfta')) && contemArt) {
    return { categoria: 'ART (Reembolsável Cliente)', privado: false, motivo: 'CREA/CFTA + descrição contém ART' };
  }

  // b) CREA/CFTA + Anuidade → Anuidades Empresa
  if ((nome.includes('crea-') || nome.includes('cfta')) && contemAnuid) {
    return { categoria: 'Anuidades CREA (Empresa)', privado: false, motivo: 'CREA/CFTA + descrição contém Anuidade' };
  }

  // c) Família/pessoal → Outros + privado
  if (/(maple bear|vértice bilíngue|apae|mútua)/.test(nome)) {
    return { categoria: 'Outros', privado: true, motivo: 'Despesa familiar/pessoal' };
  }

  // d) Bancos (cartões pessoais) → Outros + privado
  if (/^banco |c6 bank|cartões caixa/.test(nome)) {
    return { categoria: 'Outros', privado: true, motivo: 'Cartão de crédito pessoal' };
  }

  // e) Estrutura do escritório
  if (/(equatorial|saneago|^oi |allrede|^tim$|^claro$|brasoftware|prefeitura|código x country|nolberto)/.test(nome)) {
    return { categoria: 'Estrutura do Escritório', privado: false, motivo: 'Fornecedor de estrutura do escritório' };
  }

  // f) Veículos
  if (/(posto |bradesco auto|zurich|aymoré|banco rci|conseg|unidas|detran|marques e guerra|auto posto)/.test(nome)) {
    return { categoria: 'Veículos', privado: false, motivo: 'Fornecedor de veículos' };
  }

  // g) Serviços profissionais
  if (/(contar |segfort|alex caetano|joao vitor de assis|grupo alfa|artes melo|rubercy)/.test(nome)) {
    return { categoria: 'Serviços Profissionais', privado: false, motivo: 'Prestador de serviço profissional' };
  }

  // h) Tributos
  if (/(receita federal|previdência social|documento de arrecadação)/.test(nome)) {
    return { categoria: 'Impostos e Tributos', privado: false, motivo: 'Tributo' };
  }

  // i) Seguros e Consórcios
  if (/(sicoob administradora|bb administradora|caixa capitalização|aliança do brasil)/.test(nome)) {
    return { categoria: 'Seguros e Consórcios', privado: false, motivo: 'Seguro/Consórcio' };
  }

  return null;
}