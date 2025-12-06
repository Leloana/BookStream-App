const express = require('express');
const cors = require('cors');
const ip = require('ip');
const app = express();

app.use(cors()); // Permite que o App acesse
app.use(express.json());

// 1. Torna a pasta 'public' acessível via URL
// Ex: http://SEU_IP:3000/files/pdfs/livro.pdf
app.use('/files', express.static('public'));

// 2. Nosso "Banco de Dados" manual
const myBooks = [
    {
        id: 'local_1',
        title: 'A Carteira',
        author: 'Machado de Assis',
        year: 1860,
        description: 'Um conto machadiano.',
        language: ['pt'],
        pageCount: 4,
        fileName: 'A Carteira.pdf', 
        coverName: 'A Carteira.png', 
        subjects: ['Conto', 'Romance']
    },
    // Adicione mais livros aqui...
];

// 3. Rota de Busca
app.get('/books', (req, res) => {
    const { q } = req.query;
    const myIp = ip.address(); // Pega seu IP automaticamente
    const baseUrl = `http://${myIp}:3000/files`;

    // Se não tiver busca, retorna tudo. Se tiver, filtra.
    let results = myBooks;

    if (q) {
        const term = q.toLowerCase();
        results = myBooks.filter(book => 
            book.title.toLowerCase().includes(term) || 
            book.author.toLowerCase().includes(term)
        );
    }

    // Formata para o App (adiciona a URL completa)
    const formatted = results.map(book => ({
        ...book,
        coverUrl: book.coverName ? `${baseUrl}/covers/${book.coverName}` : null,
        pdfUrl: `${baseUrl}/pdfs/${encodeURIComponent(book.fileName)}`,
        source: 'local'
    }));

    res.json(formatted);
});

// Inicia o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`📚 Servidor rodando!`);
    console.log(`📡 Seu IP Local é: http://${ip.address()}:${PORT}`);
    console.log(`🔗 Rota de livros: http://${ip.address()}:${PORT}/books`);
});