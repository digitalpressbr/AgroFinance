import { toast } from "sonner";

export async function downloadAnexoComNome(anexo, conta, tipo = 'documento') {
  if (!anexo) {
    toast.error('Anexo não disponível');
    return;
  }
  const url = typeof anexo === 'string' ? anexo : anexo?.url;
  if (!url) {
    toast.error('URL do anexo inválida');
    return;
  }

  // Gerar nome amigável baseado nos campos da conta
  const tipoLabel = tipo === 'recibo' ? 'Recibo' : tipo === 'boleto' ? 'Boleto' : 'Documento';
  const desc = (conta?.descricao || 'documento')
    .replace(/[<>:"/\\|?*]/g, '')   // remove chars proibidos em filename
    .replace(/\s+/g, ' ')
    .trim();

  let suffix = '';
  if (conta?.recorrente && conta?.parcela_atual) {
    suffix = ` - parcela ${String(conta.parcela_atual).padStart(2, '0')}`;
  } else if (conta?.data_pagamento || conta?.data_vencimento) {
    const data = conta.data_pagamento || conta.data_vencimento;
    const partes = data.split('-'); // YYYY-MM-DD
    if (partes.length === 3) suffix = ` - ${partes[1]}-${partes[0]}`;
  }

  // Pegar extensão do arquivo original
  const origName = (typeof anexo === 'object' && anexo?.file_name) || '';
  const extMatch = origName.match(/\.([a-zA-Z0-9]{2,5})$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.pdf';

  const fileName = `${tipoLabel} ${desc}${suffix}${ext}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    toast.success(`${tipoLabel} baixado!`);
  } catch (err) {
    console.error('Erro ao baixar anexo via blob:', err);
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      toast.error('Pop-up bloqueado. Permita pop-ups para baixar.');
    } else {
      toast.info(`Abrindo ${tipoLabel.toLowerCase()} em nova aba — use Ctrl+S para salvar`);
    }
  }
}