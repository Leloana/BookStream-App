// Services/FileStorageService.cs
namespace BookStreamApi.Services;

public class FileStorageService
{
    private readonly string _basePath;

    public FileStorageService(IWebHostEnvironment env)
    {
        // Salva na pasta 'Uploads' dentro da raiz do projeto
        _basePath = Path.Combine(env.ContentRootPath, "Uploads");
        if (!Directory.Exists(_basePath)) Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveFileAsync(IFormFile file, string subFolder)
    {
        // Cria subpasta (ex: Uploads/pdfs)
        var folder = Path.Combine(_basePath, subFolder);
        if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

        // Gera nome único para não sobrescrever (ex: guid_livro.pdf)
        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
        var fullPath = Path.Combine(folder, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Retorna o caminho relativo para salvar no banco
        return Path.Combine(subFolder, fileName).Replace("\\", "/");
    }

    public string GetPhysicalPath(string relativePath)
    {
        return Path.Combine(_basePath, relativePath);
    }
}