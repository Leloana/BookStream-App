// Controllers/BooksController.cs
using BookStreamApi.Data;
using BookStreamApi.DTOs;
using BookStreamApi.Models;
using BookStreamApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookStreamApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly FileStorageService _fileService;
    private readonly OpenLibraryService _openLibService;
    private readonly GoogleBooksService _googleService;
    public BooksController(
        AppDbContext context, 
        FileStorageService fileService, 
        OpenLibraryService openLibService,
        GoogleBooksService googleService)  
    {
        _context = context;
        _fileService = fileService;
        _openLibService = openLibService;
        _googleService = googleService;
    }

    // GET: api/books?q=termo
    [HttpGet("local")]
    public async Task<IActionResult> GetBooks([FromQuery] string? q)
    {
        var query = _context.Books.AsQueryable();

        if (!string.IsNullOrEmpty(q))
        {
            query = query.Where(b => b.Title.ToLower().Contains(q.ToLower()) || 
                                     b.Author.ToLower().Contains(q.ToLower()));
        }

        var books = await query.ToListAsync();

        var baseUrl = $"{Request.Scheme}://{Request.Host}/api/books/download";
        // var baseUrl = "https://api.recebamaleficos.online/api/books/download";

        var response = books.Select(b => new
        {
            b.Id,
            b.Title,
            b.Author,
            b.Year,
            b.PageCount,
            b.Description,
            b.Source,
            b.Language,
            PdfUrl = b.PdfFilePath != null ? $"{baseUrl}/{b.Id}?type=pdf" : null,
            CoverUrl = b.CoverFilePath != null ? $"{baseUrl}/{b.Id}?type=cover" : null
        });

        return Ok(response);
    }
    // POST: api/books (Upload)
    [HttpPost]
    public async Task<IActionResult> CreateBook([FromForm] CreateBookDto dto)
    {
        var book = new Book
        {
            Title = dto.Title,
            Author = dto.Author,
            Year = dto.Year,
            PageCount = dto.PageCount,
            Description = dto.Description,
            Language = dto.Language
        };

        if (dto.PdfFile != null)
        {
            book.PdfFilePath = await _fileService.SaveFileAsync(dto.PdfFile, "pdfs");
        }

        if (dto.CoverFile != null)
        {
            book.CoverFilePath = await _fileService.SaveFileAsync(dto.CoverFile, "covers");
        }

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBooks), new { id = book.Id }, book);
    }

    // GET: api/books/download/{id}?type=pdf
    [HttpGet("download/{id}")]
    [HttpHead("download/{id}")]
    public async Task<IActionResult> DownloadFile(Guid id, [FromQuery] string type)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null) return NotFound();

        string? relativePath = type == "cover" ? book.CoverFilePath : book.PdfFilePath;
        if (string.IsNullOrEmpty(relativePath)) return NotFound("Arquivo não encontrado.");

        var physicalPath = _fileService.GetPhysicalPath(relativePath);
        if (!System.IO.File.Exists(physicalPath)) return NotFound("Arquivo físico não existe.");

        var contentType = type == "cover" ? "image/jpeg" : "application/pdf";
        
        // Retorna o arquivo como Stream (Eficiente para arquivos grandes)
        var fileStream = new FileStream(physicalPath, FileMode.Open, FileAccess.Read);
        return File(fileStream, contentType, enableRangeProcessing: true); // enableRangeProcessing é ótimo para PDF streaming
    }
    
    // === 2. GET OPEN LIBRARY: api/books/open-library?q=termo&lang=pt&subject=ficcao ===
    [HttpGet("open-library")]
    public async Task<IActionResult> GetBooksOpenLibrary(
        [FromQuery] string? q, 
        [FromQuery] string? lang, 
        [FromQuery] string? subject)
    {
        // Se não houver filtros, retorna vazio para não sobrecarregar a API
        if (string.IsNullOrWhiteSpace(q) && string.IsNullOrWhiteSpace(lang) && string.IsNullOrWhiteSpace(subject))
        {
            return Ok(new List<BookResponseDto>());
        }

        // Chama o Service que criamos anteriormente
        var books = await _openLibService.SearchBooksAsync(q ?? "", lang, subject);

        return Ok(books);
    }
    // GET: api/books/open-library/details?id=/works/OL123W
    [HttpGet("open-library/details")]
    public async Task<IActionResult> GetBookDetails([FromQuery] string id)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest("O ID do livro é obrigatório.");

        // Chama o serviço
        var details = await _openLibService.GetBookDetailsAsync(id);

        return Ok(details);
    }
    // === 3. GET GOOGLE BOOKS: api/books/google?q=termo ===
    [HttpGet("google")]
    public async Task<IActionResult> GetGoogleBooks(
        [FromQuery] string? q, 
        [FromQuery] string? lang, 
        [FromQuery] string? subject)
    {
        if (string.IsNullOrWhiteSpace(q) && string.IsNullOrWhiteSpace(subject))
        {
             return Ok(new List<BookResponseDto>());
        }

        var books = await _googleService.SearchBooksAsync(q ?? "", lang, subject);
        return Ok(books);
    }
}