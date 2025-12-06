import axios from 'axios';
import { LOCAL_SERVER_URL } from '../../config/apiConfig';
import { Book } from '../../domain/models/Book';

export async function searchLocalBooks(query: string): Promise<Book[]> {
  try {
    // A rota do .NET é /books?q=...
    const response = await axios.get(`${LOCAL_SERVER_URL}/books`, {
        params: { q: query },
        timeout: 5000 
    });

    // O .NET já devolve a lista formatada, só precisamos garantir a tipagem
    // e o source: 'local' (se o backend já não mandar)
    return response.data.map((item: any) => ({
        ...item,
        source: 'local',
        // Garante que as datas/números venham certos
        year: item.year,
        pageCount: item.pageCount
    }));

  } catch (error) {
    console.log('Erro Local API:', error);
    return [];
  }
}