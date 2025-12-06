import axios from 'axios';
import { LOCAL_SERVER_URL } from '../../config/apiConfig';
import { Book } from '../../domain/models/Book';

export async function searchLocalBooks(query: string): Promise<Book[]> {
  try {
    const url = `${LOCAL_SERVER_URL}/books`;
    
    // Log para saber que a requisição começou
    //console.log(`[LocalAPI] Buscando em: ${url} | Query: "${query}"`);

    const response = await axios.get(url, {
        params: { q: query },
        timeout: 2000 
    });

    // === AQUI ESTÁ O SEGREDO ===
    // JSON.stringify(data, null, 2) deixa o JSON bonito e indentado no terminal
    //console.log('✅ [LocalAPI] Resposta Recebida:');
    //console.log(JSON.stringify(response.data, null, 2)); 
    // ===========================

    const data = response.data || [];

    return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        author: item.author,
        year: item.year,
        coverUrl: item.coverUrl,
        pdfUrl: item.pdfUrl,
        description: item.description,
        pageCount: item.pageCount,
        language: item.language,
        subjects: item.subjects,
        source: 'local',
    } as Book));

  } catch (error: any) {
    // Log detalhado de erro
    //console.log('❌ [LocalAPI] Erro:');
    if (error.response) {
        // O servidor respondeu com erro (ex: 404, 500)
        //console.log('Status:', error.response.status);
        //console.log('Dados:', error.response.data);
    } else if (error.request) {
        // A requisição foi feita mas não houve resposta (Provável erro de IP/Rede)
        //console.log('Sem resposta do servidor. Verifique o IP e se o Node.js está rodando.');
    } else {
        //console.log('Erro de configuração:', error.message);
    }
    return [];
  }
}