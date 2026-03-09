import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    return Response.json({
        EVOLUTION_API_URL: Deno.env.get("EVOLUTION_API_URL"),
        EVOLUTION_API_KEY: Deno.env.get("EVOLUTION_API_KEY"),
        EVOLUTION_INSTANCE_NAME: Deno.env.get("EVOLUTION_INSTANCE_NAME"),
    });
});