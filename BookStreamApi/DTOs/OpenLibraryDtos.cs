using System.Text.Json.Serialization;

namespace BookStreamApi.DTOs.OpenLibrary;

// Mapeia a resposta raiz da API
public class OpenLibrarySearchResponse
{
    [JsonPropertyName("docs")]
    public List<OpenLibraryDoc>? Docs { get; set; }
}

// Mapeia cada livro individual (equivalente ao seu OpenLibraryDoc no front)
public class OpenLibraryDoc
{
    [JsonPropertyName("key")]
    public string? Key { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("author_name")]
    public List<string>? AuthorName { get; set; }

    [JsonPropertyName("first_publish_year")]
    public int? FirstPublishYear { get; set; }

    [JsonPropertyName("cover_i")]
    public int? CoverI { get; set; }

    [JsonPropertyName("ia")]
    public List<string>? Ia { get; set; } // Importante para o PDF

    [JsonPropertyName("number_of_pages_median")]
    public int? NumberOfPagesMedian { get; set; }

    [JsonPropertyName("language")]
    public List<string>? Language { get; set; }
    
    [JsonPropertyName("description")]
    public object? Description { get; set; } // Pode ser string ou objeto
    
    [JsonPropertyName("subjects")]
    public List<string>? Subjects { get; set; }
}