using System.Text.Json.Serialization;

namespace BookStreamApi.DTOs.GoogleBooks;

// Raiz da resposta
public class GoogleBooksRoot
{
    [JsonPropertyName("items")]
    public List<GoogleBookItem>? Items { get; set; }
}

public class GoogleBookItem
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("volumeInfo")]
    public VolumeInfo? VolumeInfo { get; set; }

    [JsonPropertyName("accessInfo")]
    public AccessInfo? AccessInfo { get; set; }
}

public class VolumeInfo
{
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("authors")]
    public List<string>? Authors { get; set; }

    [JsonPropertyName("publishedDate")]
    public string? PublishedDate { get; set; } // Vem como string "2023-01-01" ou só "2023"

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("pageCount")]
    public int? PageCount { get; set; }

    [JsonPropertyName("language")]
    public string? Language { get; set; }

    [JsonPropertyName("categories")]
    public List<string>? Categories { get; set; }

    [JsonPropertyName("imageLinks")]
    public ImageLinks? ImageLinks { get; set; }
}

public class ImageLinks
{
    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; set; }
}

public class AccessInfo
{
    [JsonPropertyName("webReaderLink")]
    public string? ReadUrl { get; set; }

    [JsonPropertyName("pdf")]
    public PdfInfo? Pdf { get; set; }
}

public class PdfInfo
{
    [JsonPropertyName("isAvailable")]
    public bool IsAvailable { get; set; }

    [JsonPropertyName("downloadLink")]
    public string? DownloadLink { get; set; }
}