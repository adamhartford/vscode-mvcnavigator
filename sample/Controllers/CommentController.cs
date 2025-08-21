using Microsoft.AspNetCore.Mvc;

namespace SampleMvcApp.Controllers
{
    public class CommentController : Controller
    {
        public IActionResult GetCommentsList(int productId = 1)
        {
            var comments = GetCommentsForProduct(productId);
            return PartialView("_CommentsList", comments);
        }

        private List<CommentModel> GetCommentsForProduct(int productId)
        {
            return new List<CommentModel>
            {
                new CommentModel 
                { 
                    Id = 1, 
                    Author = "John Doe", 
                    Text = "Great product! Highly recommended.", 
                    Date = DateTime.Now.AddDays(-5),
                    ProductId = productId 
                },
                new CommentModel 
                { 
                    Id = 2, 
                    Author = "Jane Smith", 
                    Text = "Good value for money.", 
                    Date = DateTime.Now.AddDays(-2),
                    ProductId = productId 
                }
            };
        }
    }

    public class CommentModel
    {
        public int Id { get; set; }
        public string Author { get; set; } = "";
        public string Text { get; set; } = "";
        public DateTime Date { get; set; } = DateTime.Now;
        public int? ProductId { get; set; }
    }
}
