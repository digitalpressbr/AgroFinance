import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const GRUPO_ID = "120363424659062662@g.us";

  console.log("Iniciando listagem de ContaPagar...");
  const contas = await base44.asServiceRole.entities.ContaPagar.list();
  console.log(`ContaPagar encontradas: ${contas.length}`);

  for (const conta of contas) {
    await base44.asServiceRole.entities.ContaPagar.update(conta.id, { grupo_whatsapp_id: GRUPO_ID });
  }
  console.log("ContaPagar atualizadas.");

  console.log("Iniciando listagem de Lembrete...");
  const lembretes = await base44.asServiceRole.entities.Lembrete.list();
  console.log(`Lembretes encontrados: ${lembretes.length}`);

  for (const lembrete of lembretes) {
    await base44.asServiceRole.entities.Lembrete.update(lembrete.id, { grupo_whatsapp_id: GRUPO_ID });
  }
  console.log("Lembretes atualizados.");

  return Response.json({
    contasAtualizadas: contas.length,
    lembretesAtualizados: lembretes.length
  });
});