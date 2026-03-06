import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const agora = new Date();
  const localeString = agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });

  return Response.json({
    "1_isoString": agora.toISOString(),
    "2_localeStringSaoPaulo": localeString,
    "3_getHours_from_localeString": new Date(localeString).getHours(),
    "4_getUTCHours": agora.getUTCHours(),
    "5_utcMinus3_manual": (agora.getUTCHours() - 3 + 24) % 24
  });
});