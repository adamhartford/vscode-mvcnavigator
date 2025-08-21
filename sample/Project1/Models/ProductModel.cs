namespace Project1.Models
{
    public class ProductModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal Price { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
