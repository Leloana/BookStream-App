using BookStreamApi.DTOs;
using BookStreamApi.DTOs.GoogleBooks;

namespace BookStreamApi.Services;

public class GoogleBooksService
{
    private readonly HttpClient _httpClient;

    // Mapeamento de idiomas igual ao seu frontend
    private static readonly Dictionary<string, string> GoogleLangMap = new()
    {
        { "por", "pt" },
        { "eng", "en" },
        { "spa", "es" },
        { "fre", "fr" }
    };

    public GoogleBooksService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://www.googleapis.com/books/v1/");
    }

    public async Task<List<BookResponseDto>> SearchBooksAsync(string query, string? language = null, string? subject = null)
    {
        try
        {
            // 1. Lógica de Query (subject e termos)
            var qParam = query?.Trim() ?? "";

            if (!string.IsNullOrEmpty(subject))
            {
                var subjectTerm = $"subject:{subject}";
                qParam = string.IsNullOrEmpty(qParam) ? subjectTerm : $"{qParam}+{subjectTerm}";
            }

            if (string.IsNullOrEmpty(qParam)) qParam = "*"; // Wildcard se vazio

            // 2. Construção dos parâmetros da URL
            // filter=free-ebooks: essencial para trazer livros gratuitos
            var url = $"volumes?q={Uri.EscapeDataString(qParam)}&filter=free-ebooks&maxResults=15&printType=books";

            // 3. Restrição de Idioma
            if (!string.IsNullOrEmpty(language))
            {
                // Tenta pegar do mapa, se não existir usa o original
                var langCode = GoogleLangMap.ContainsKey(language) ? GoogleLangMap[language] : language;
                url += $"&langRestrict={langCode}";
            }

            // 4. Chamada HTTP
            var root = await _httpClient.GetFromJsonAsync<GoogleBooksRoot>(url);

            if (root?.Items == null) return new List<BookResponseDto>();

            // 5. Mapeamento para o DTO Unificado
            return root.Items.Select(item =>
            {
                var info = item.VolumeInfo;
                var access = item.AccessInfo;

                // Lógica da URL do PDF
                string? pdfUrl = null;
                if (access?.Pdf != null && access.Pdf.IsAvailable && !string.IsNullOrEmpty(access.Pdf.DownloadLink))
                {
                    pdfUrl = access.Pdf.DownloadLink;
                }

                // Lógica de correção HTTPS da Capa
                string? coverUrl = info?.ImageLinks?.Thumbnail;
                if (!string.IsNullOrEmpty(coverUrl) && coverUrl.StartsWith("http://"))
                {
                    coverUrl = coverUrl.Replace("http://", "https://");
                }

                // Tratamento do ano (PublishedDate pode ser "2023-05-10" ou "2023")
                int year = 0;
                if (!string.IsNullOrEmpty(info?.PublishedDate) && info.PublishedDate.Length >= 4)
                {
                    int.TryParse(info.PublishedDate.Substring(0, 4), out year);
                }

                return new BookResponseDto
                {
                    Id = item.Id ?? Guid.NewGuid().ToString(), // Google ID é string
                    Title = info?.Title ?? "Sem Título",
                    Author = info?.Authors?.FirstOrDefault() ?? "Autor Desconhecido",
                    Year = year,
                    PageCount = info?.PageCount ?? 0,
                    Description = info?.Description,
                    Source = "google",
                    PdfUrl = pdfUrl,
                    // Se não tiver PDF direto, mandamos o link de leitura web
                    // (Opcional, depende de como seu app lida com isso)
                    // ReadUrl = access?.WebReaderLink, 
                    CoverUrl = coverUrl,
                    Language = !string.IsNullOrEmpty(info?.Language) ? new List<string> { info.Language } : null
                };
            }).ToList();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro GoogleBooks: {ex.Message}");
            return new List<BookResponseDto>();
        }
    }
}