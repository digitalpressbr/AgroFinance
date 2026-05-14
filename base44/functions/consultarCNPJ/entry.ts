// Consulta CNPJ via BrasilAPI (pública, sem necessidade de secret)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { cnpj } = await req.json();
    if (!cnpj) return Response.json({ error: 'CNPJ obrigatório' }, { status: 400 });

    const numeros = String(cnpj).replace(/\D/g, '');
    if (numeros.length !== 14) {
      return Response.json({ error: 'CNPJ deve ter 14 dígitos' }, { status: 400 });
    }

    // BrasilAPI - gratuita e pública
    const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${numeros}`);
    if (!resp.ok) {
      const txt = await resp.text();
      return Response.json({ error: `CNPJ não encontrado (${resp.status})`, detalhe: txt }, { status: resp.status });
    }

    const data = await resp.json();
    return Response.json({
      success: true,
      cnpj: numeros,
      razao_social: data.razao_social || data.nome || '',
      nome_fantasia: data.nome_fantasia || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      situacao: data.descricao_situacao_cadastral || '',
      cnae_fiscal: data.cnae_fiscal ? String(data.cnae_fiscal) : '',
      cnae_fiscal_descricao: data.cnae_fiscal_descricao || ''
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});