namespace Project1.ViewModels
{
    public class ProductEditViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal Price { get; set; }
    }

    public class ProductCreateViewModel
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public decimal Price { get; set; }
    }

    public class ProductFormViewModel
    {
        public string Title { get; set; } = "Product Form";
    }
}
