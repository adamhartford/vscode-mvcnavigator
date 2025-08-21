namespace Project2.Models
{
    public class ProductModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal Price { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }

    public class CategoryModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public int ProductCount { get; set; }
    }
}
