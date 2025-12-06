// DTOs/CreateBookDto.cs
namespace BookStreamApi.DTOs;

public class CreateBookDto
{
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public int? Year { get; set; }
    public int? PageCount { get; set; }
    public string? Description { get; set; }
    
    // Arquivos vêm via multipart/form-data
    public IFormFile? PdfFile { get; set; }
    public IFormFile? CoverFile { get; set; }
}