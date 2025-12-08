import axios from 'axios';
import { LOCAL_SERVER_URL } from '../../config/apiConfig';
import { Book } from '../../domain/models/Book';

export async function searchLocalBooks(query: string): Promise<Book[]> {
  try {
    // A rota do .NET é /books?q=...
    const response = await axios.get(`${LOCAL_SERVER_URL}/books/local`, {
        params: { q: query },
        timeout: 5000 
    });
    return response.data.map((item: any) => ({
        ...item,
        source: 'local',
        year: item.year,
        pageCount: item.pageCount
    }));

  } catch (error) {
    console.log('Erro Local API:', error);
    return [];
  }
}