// Models/Book.cs
using System.ComponentModel.DataAnnotations;

namespace BookStreamApi.Models;

public class Book
{
    public Guid Id { get; set; } = Guid.NewGuid(); // ID único automático

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Author { get; set; } = string.Empty;

    public int? Year { get; set; }
    public int? PageCount { get; set; }
    public string? Description { get; set; }
    

    public string? PdfFilePath { get; set; } 
    public string? CoverFilePath { get; set; }

    // Campos de auditoria
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public string Source { get; set; } = "local"; 
}