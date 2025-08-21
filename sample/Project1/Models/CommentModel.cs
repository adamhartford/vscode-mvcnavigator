namespace Project1.Models
{
    public class CommentModel
    {
        public int Id { get; set; }
        public string Author { get; set; } = "";
        public string Text { get; set; } = "";
        public DateTime Date { get; set; } = DateTime.Now;
        public int? ProductId { get; set; }
    }
}
