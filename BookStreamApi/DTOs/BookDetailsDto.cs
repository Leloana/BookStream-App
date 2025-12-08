namespace BookStreamApi.DTOs;

public class BookDetailsDto
{
    public string Description { get; set; } = "Sem descrição disponível.";
    public List<string> Subjects { get; set; } = new();
}