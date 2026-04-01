Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const acao = payload.acao || 'status';
    const instancia = payload.instancia;
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return Response.json({ error: 'Credenciais da Evolution API não configuradas' }, { status: 500 });
    }
    const headers = { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY };

    if (acao === 'status') {
      const response = await fetch(EVOLUTION_API_URL + '/instance/fetchInstances', { headers });
      const instances = await response.json();
      if (!response.ok) return Response.json({ success: false, error: 'Erro ao buscar instâncias' });
      const resultado = instances.map((inst) => ({
        nome: inst.name, status: inst.connectionStatus, perfil: inst.profileName || '-',
        numero: inst.ownerJid ? inst.ownerJid.replace('@s.whatsapp.net', '') : '',
        foto: inst.profilePicUrl || null, desconexao: inst.disconnectedAt,
        motivoDesconexao: inst.disconnectReason, mensagens: inst.count?.messages || 0, contatos: inst.count?.contacts || 0
      }));
      return Response.json({ success: true, instancias: resultado });
    }

    if (!instancia) return Response.json({ error: 'Parâmetro obrigatório: instancia' }, { status: 400 });

    if (acao === 'conectar') {
      const response = await fetch(EVOLUTION_API_URL + '/instance/connect/' + instancia, { method: 'GET', headers });
      const resultado = await response.json();
      if (!response.ok) return Response.json({ success: false, error: 'Erro ao gerar QR Code' });
      return Response.json({ success: true, instancia, qrcode: resultado.base64 || null, pairingCode: resultado.pairingCode || null, count: resultado.count || 0 });
    }

    if (acao === 'desconectar') {
      const response = await fetch(EVOLUTION_API_URL + '/instance/logout/' + instancia, { method: 'DELETE', headers });
      const resultado = await response.json();
      return Response.json({ success: response.ok, instancia, mensagem: response.ok ? 'Instância desconectada' : 'Erro ao desconectar', detalhes: resultado });
    }

    if (acao === 'reiniciar') {
      const response = await fetch(EVOLUTION_API_URL + '/instance/restart/' + instancia, { method: 'PUT', headers });
      const resultado = await response.json();
      return Response.json({ success: response.ok, instancia, mensagem: response.ok ? 'Instância reiniciada' : 'Erro ao reiniciar', detalhes: resultado });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: 'Erro interno: ' + err.message }, { status: 500 });
  }
});