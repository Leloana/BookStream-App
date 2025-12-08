using System.Text.Json;
using BookStreamApi.DTOs.OpenLibrary;
using BookStreamApi.DTOs; // Onde você deve ter um DTO de retorno unificado
using System.Text.Json;

namespace BookStreamApi.Services;

public class OpenLibraryService
{
    private readonly HttpClient _httpClient;
    
    // Constante de campos igual ao seu front
    private const string SEARCH_FIELDS = "key,title,author_name,first_publish_year,cover_i,ia,ebook_access,public_scan_b,number_of_pages_median,language";

    public OpenLibraryService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://openlibrary.org");
        // Importante: User-Agent é exigido pela OpenLibrary
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "BookStreamAPI/1.0 (seu-email@exemplo.com)");
    }

    public async Task<List<BookResponseDto>> SearchBooksAsync(string query, string? language = null, string? subject = null)
    {
        // 1. Validação básica (igual ao seu JS)
        if (string.IsNullOrWhiteSpace(query) && string.IsNullOrWhiteSpace(language) && string.IsNullOrWhiteSpace(subject))
        {
            return new List<BookResponseDto>();
        }

        // 2. Montagem da Query String
        var finalQuery = $"{query.Trim()} ebook_access:public";

        if (!string.IsNullOrEmpty(language))
            finalQuery += $" language:{language}";
            
        if (!string.IsNullOrEmpty(subject))
            finalQuery += $" subject:{subject}";

        try 
        {
            // 3. Chamada à API
            // Note que usamos Uri.EscapeDataString para segurança
            var url = $"/search.json?q={Uri.EscapeDataString(finalQuery)}&has_fulltext=true&limit=30&fields={SEARCH_FIELDS}";
            
            var response = await _httpClient.GetFromJsonAsync<OpenLibrarySearchResponse>(url);
            
            if (response?.Docs == null) return new List<BookResponseDto>();

            // 4. Mapeamento (A lógica que estava em mapDocsToBooks)
            var mappedBooks = response.Docs
                .Where(doc => !string.IsNullOrEmpty(doc.Key) && 
                              !string.IsNullOrEmpty(doc.Title) && 
                              doc.Ia != null && doc.Ia.Count > 0) // Filtro de integridade
                .Select(doc => 
                {
                    var iaId = doc.Ia![0];
                    return new BookResponseDto
                    {
                        Id = doc.Key, // Mantem o formato "/works/OL..."
                        Title = doc.Title,
                        Author = doc.AuthorName?.FirstOrDefault() ?? "Desconhecido",
                        Year = doc.FirstPublishYear ?? 0,
                        PageCount = doc.NumberOfPagesMedian ?? 0,
                        Source = "openlibrary",
                        // Lógica de URL do PDF
                        PdfUrl = $"https://archive.org/download/{iaId}/{iaId}.pdf",
                        // Lógica de URL da Capa
                        CoverUrl = doc.CoverI.HasValue 
                            ? $"https://covers.openlibrary.org/b/id/{doc.CoverI}-L.jpg" 
                            : null,
                        Language = doc.Language,
                        Description = "Detalhes disponíveis via clique" // OpenLibrary Search não retorna descrição completa
                    };
                })
                .ToList();

            return mappedBooks;
        }
        catch (Exception ex)
        {
            // Logar erro aqui se necessário
            Console.WriteLine($"Erro OpenLibrary: {ex.Message}");
            return new List<BookResponseDto>(); // Retorna vazio em caso de falha para não quebrar o app
        }
    }
    public async Task<BookDetailsDto> GetBookDetailsAsync(string workId)
    {
        try
        {
            if (!workId.StartsWith("/works/"))
            {
                workId = $"/works/{workId}"; 
            }

            var url = $"{workId}.json";
            
            var jsonDoc = await _httpClient.GetFromJsonAsync<JsonDocument>(url);
            
            if (jsonDoc == null) return new BookDetailsDto();

            var root = jsonDoc.RootElement;
            var details = new BookDetailsDto();


            if (root.TryGetProperty("description", out var descElement))
            {
                if (descElement.ValueKind == JsonValueKind.String)
                {
                    details.Description = descElement.GetString() ?? "";
                }
                else if (descElement.ValueKind == JsonValueKind.Object && 
                        descElement.TryGetProperty("value", out var valueElement))
                {
                    details.Description = valueElement.GetString() ?? "";
                }
            }

            if (root.TryGetProperty("subjects", out var subjectsElement) && 
                subjectsElement.ValueKind == JsonValueKind.Array)
            {
                details.Subjects = subjectsElement.EnumerateArray()
                    .Take(5)
                    .Select(x => x.GetString())
                    .Where(x => !string.IsNullOrEmpty(x))
                    .Cast<string>() 
                    .ToList();
            }

            return details;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao buscar detalhes ({workId}): {ex.Message}");
            return new BookDetailsDto();
        }
    }
}

public class BookResponseDto 
{
    public object Id { get; set; } // Pode ser Guid (banco) ou string (OpenLibrary)
    public string Title { get; set; }
    public string Author { get; set; }
    public int Year { get; set; }
    public int PageCount { get; set; }
    public string? Description { get; set; }
    public string Source { get; set; }
    public string? PdfUrl { get; set; }
    public string? CoverUrl { get; set; }
    public List<string>? Language { get; set; }
}