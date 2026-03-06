import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Horário de Brasília (UTC-3)
    const agora = new Date();
    const agoraBrasilia = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    
    const diaHoje = String(agoraBrasilia.getDate()).padStart(2, '0');
    const mesHoje = String(agoraBrasilia.getMonth() + 1).padStart(2, '0');
    
    console.log(`[DIAGNÓSTICO] UTC: ${agora.toISOString()} | BRT: ${String(agoraBrasilia.getHours()).padStart(2,'0')}:${String(agoraBrasilia.getMinutes()).padStart(2,'0')}`);
    console.log(`Verificando aniversários do dia ${diaHoje}/${mesHoje}`);
    
    // Buscar todos os clientes com lembrete ativo
    const clientes = await base44.asServiceRole.entities.Cliente.list();
    const clientesAniversariantes = clientes.filter(cliente => {
      if (!cliente.enviar_lembrete_aniversario || !cliente.data_nascimento) {
        return false;
      }
      
      const dataNasc = new Date(cliente.data_nascimento + 'T00:00:00');
      const diaNasc = String(dataNasc.getDate()).padStart(2, '0');
      const mesNasc = String(dataNasc.getMonth() + 1).padStart(2, '0');
      
      return diaNasc === diaHoje && mesNasc === mesHoje;
    });
    
    console.log(`${clientesAniversariantes.length} aniversariante(s) encontrado(s)`);
    
    let enviados = 0;
    const erros = [];
    
    for (const cliente of clientesAniversariantes) {
      try {
        console.log(`Processando ${cliente.nome}...`);
        
        // Enviar PRIMEIRO o cartão para o cliente (independente do lembrete para o escritório)
        if (cliente.whatsapp_cliente && cliente.cartao_aniversario_url) {
          try {
            console.log(`Enviando cartão para WhatsApp: ${cliente.whatsapp_cliente}`);
            
            const cartaoResponse = await base44.asServiceRole.functions.invoke('enviarWhatsAppEvolution', {
              numero: cliente.whatsapp_cliente,
              imagem_url: cliente.cartao_aniversario_url
            });
            
            if (cartaoResponse.success) {
              console.log(`Cartão enviado para o cliente ${cliente.nome} em ${cliente.whatsapp_cliente}`);
            } else {
              console.error(`Erro ao enviar cartão: ${JSON.stringify(cartaoResponse)}`);
              erros.push({ cliente: cliente.nome, tipo: 'cartão', erro: cartaoResponse.error });
            }
          } catch (imgError) {
            console.error(`Exceção ao enviar cartão para ${cliente.nome}:`, imgError);
            erros.push({ cliente: cliente.nome, tipo: 'cartão', erro: imgError.message });
          }
        } else {
          console.warn(`${cliente.nome}: WhatsApp=${cliente.whatsapp_cliente}, Cartão=${cliente.cartao_aniversario_url}`);
        }
        
        // DEPOIS enviar lembrete para o escritório
        const destino = cliente.aniversario_grupo_whatsapp_id || cliente.aniversario_telefone_contato;
        
        if (!destino) {
          console.warn(`Cliente ${cliente.nome} sem telefone/grupo configurado para lembrete do escritório`);
          continue;
        }
        
        // Extrair primeiro e segundo nome
        const partesNome = cliente.nome ? cliente.nome.split(' ') : ['Cliente'];
        const primeiroSegundoNome = partesNome.length >= 2 
          ? `${partesNome[0]} ${partesNome[1]}` 
          : partesNome[0];
        
        const mensagem = `🎂 *Lembrete de Aniversário*\n\nHoje é aniversário de *${primeiroSegundoNome}*!\n\nNão esqueça de parabenizá-lo(a)! 🎉`;
        
        console.log(`Enviando lembrete para escritório: ${destino}`);
        
        const response = await base44.asServiceRole.functions.invoke('enviarWhatsAppEvolution', {
          numero: destino,
          mensagem: mensagem
        });
        
        if (response.success) {
          enviados++;
          console.log(`Lembrete do escritório enviado para ${cliente.nome}`);
        } else {
          erros.push({ cliente: cliente.nome, tipo: 'lembrete_escritorio', erro: response.error });
          console.error(`Erro ao enviar lembrete do escritório:`, response.error);
        }
      } catch (error) {
        erros.push({ cliente: cliente.nome, erro: error.message });
        console.error(`Erro ao processar ${cliente.nome}:`, error.message);
      }
    }
    
    return Response.json({
      success: true,
      total_aniversariantes: clientesAniversariantes.length,
      lembretes_enviados: enviados,
      erros: erros
    });
    
  } catch (error) {
    console.error('Erro geral:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});