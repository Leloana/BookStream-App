using BookStreamApi.Data;
using BookStreamApi.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar Banco de Dados (Postgres)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Registrar Serviço de Arquivos
builder.Services.AddSingleton<FileStorageService>();
builder.Services.AddHttpClient<OpenLibraryService>();
builder.Services.AddHttpClient<GoogleBooksService>();

builder.Services.AddControllers().AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });;
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 3. Aplicar Migrations automaticamente ao iniciar (Facilita o teste)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection(); // Comente isso se for rodar localmente no IP para evitar erros de certificado no Android

app.MapControllers();

// Importante: Rodar no IP 0.0.0.0 para ser acessível na rede
app.Run("http://0.0.0.0:3000");