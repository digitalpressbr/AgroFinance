import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const GRUPO_ID = "120363424659062662@g.us";

  const [contas, lembretes] = await Promise.all([
    base44.asServiceRole.entities.ContaPagar.list(),
    base44.asServiceRole.entities.Lembrete.list()
  ]);

  console.log(`ContaPagar: ${contas.length}, Lembretes: ${lembretes.length}`);

  await Promise.all([
    ...contas.map(c => base44.asServiceRole.entities.ContaPagar.update(c.id, { grupo_whatsapp_id: GRUPO_ID })),
    ...lembretes.map(l => base44.asServiceRole.entities.Lembrete.update(l.id, { grupo_whatsapp_id: GRUPO_ID }))
  ]);

  console.log("Tudo atualizado!");

  return Response.json({
    contasAtualizadas: contas.length,
    lembretesAtualizados: lembretes.length
  });
});