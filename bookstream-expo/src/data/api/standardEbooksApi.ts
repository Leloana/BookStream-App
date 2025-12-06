import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Book } from '../../domain/models/Book';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
});

export async function getStandardEbooks(): Promise<Book[]> {
  try {
    // Baixa o feed dos livros mais recentes/populares
    const response = await axios.get('https://standardebooks.org/opds/all');
    
    // Converte XML para Objeto JS
    const jsonObj = parser.parse(response.data);
    
    const entries = jsonObj.feed.entry || [];

    // Mapeia para o nosso modelo
    return entries.slice(0, 15).map((entry: any) => {
      // O XML parser pode retornar um objeto único ou array de links. Normalizamos para array.
      const links = Array.isArray(entry.link) ? entry.link : [entry.link];
      
      // 1. Achar a Capa
      const coverLink = links.find((l: any) => 
        l['@_rel'] === 'http://opds-spec.org/image' || 
        l['@_rel'] === 'http://opds-spec.org/image/thumbnail'
      );

      // 2. Achar o arquivo de leitura (Prioridade: ePub compatível)
      // O StandardEbooks tem "application/epub+zip"
      const epubLink = links.find((l: any) => 
        l['@_type'] === 'application/epub+zip'
      );

      return {
        id: `std_${entry.id.split('/').pop()}`, // ID único baseado na URL
        title: entry.title,
        author: entry.author?.name || 'Desconhecido',
        year: parseInt(entry.updated?.substring(0, 4)) || undefined, // Usa data de update como referência
        
        // As URLs no XML as vezes são relativas, mas no feed 'all' costumam ser absolutas.
        // Se precisar corrigir: `https://standardebooks.org${coverLink['@_href']}`
        coverUrl: coverLink ? coverLink['@_href'] : undefined,
        
        // Mapeamos o ePub para o readUrl (para abrir no navegador/download externo)
        readUrl: epubLink ? epubLink['@_href'] : undefined,
        pdfUrl: undefined, // Eles não produzem PDF
        
        description: entry.content ? entry.content['#text'] : '',
        language: ['eng'], // O foco deles é língua inglesa
        source: 'standard', // Novo identificador
      } as Book;
    });

  } catch (e) {
    console.error('Erro Standard Ebooks:', e);
    return [];
  }
}