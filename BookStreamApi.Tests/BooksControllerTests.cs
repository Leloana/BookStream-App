using BookStreamApi.Controllers;
using BookStreamApi.Data;
using BookStreamApi.DTOs;
using BookStreamApi.Models;
using BookStreamApi.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BookStreamApi.Tests;

public class BooksControllerTests
{
    private readonly AppDbContext _context;
    
    // Mocks dos serviços
    private readonly Mock<FileStorageService> _mockFileService;
    private readonly Mock<OpenLibraryService> _mockOpenLibService;
    private readonly Mock<GoogleBooksService> _mockGoogleService;

    public BooksControllerTests()
    {
        // 1. Configura Banco em Memória
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        // 2. Configura o Ambiente Falso (evita erro no FileStorageService)
        var mockEnv = new Mock<IWebHostEnvironment>();
        mockEnv.Setup(e => e.WebRootPath).Returns("C:/Temp/TestPath");
        mockEnv.Setup(e => e.ContentRootPath).Returns("C:/Temp/TestPath");
        
        // Cria o Mock do FileStorage passando o ambiente
        _mockFileService = new Mock<FileStorageService>(mockEnv.Object); 

        // 3. CORREÇÃO DE AGORA: Os serviços OpenLibrary e GoogleBooks precisam de um HttpClient no construtor.
        var dummyHttpClient = new HttpClient(); 
        
        // Passamos esse cliente dummy para os Mocks não quebrarem na inicialização
        _mockOpenLibService = new Mock<OpenLibraryService>(dummyHttpClient);
        _mockGoogleService = new Mock<GoogleBooksService>(dummyHttpClient);
    }

    [Fact]
    public async Task GetBooks_DeveRetornarLivros_QuandoExistiremNoBanco()
    {
        // === ARRANGE ===
        _context.Books.Add(new Book 
        { 
            Title = "O Senhor dos Anéis", 
            Author = "Tolkien",
            Source = "local"
        });
        await _context.SaveChangesAsync();

        var controller = new BooksController(
            _context, 
            _mockFileService.Object, 
            _mockOpenLibService.Object, 
            _mockGoogleService.Object
        );

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        controller.HttpContext.Request.Scheme = "http";
        controller.HttpContext.Request.Host = new HostString("localhost");

        // === ACT ===
        var result = await controller.GetBooks(null);

        // === ASSERT ===
        var okResult = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<object>>(okResult.Value);
        Assert.NotEmpty(items);
    }

    [Fact]
    public async Task CreateBook_DeveSalvarNoBanco_QuandoDadosSaoValidos()
    {
        // === ARRANGE ===
        var controller = new BooksController(
            _context,
            _mockFileService.Object, 
            _mockOpenLibService.Object, 
            _mockGoogleService.Object
        );

        var novoLivroDto = new CreateBookDto
        {
            Title = "Harry Potter",
            Author = "J.K. Rowling",
            Year = 2001,
            Language = "pt-BR"
        };

        // === ACT ===
        var result = await controller.CreateBook(novoLivroDto);

        // === ASSERT ===
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        
        var livroNoBanco = await _context.Books.FirstOrDefaultAsync(b => b.Title == "Harry Potter");
        Assert.NotNull(livroNoBanco);
        Assert.Equal("J.K. Rowling", livroNoBanco.Author);
    }
}