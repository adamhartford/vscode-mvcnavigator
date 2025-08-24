using Microsoft.AspNetCore.Mvc;

namespace NavTest.ViewComponents
{
    public class ProductListViewComponent : ViewComponent
    {
        public IViewComponentResult InvokeAsync(object model)
        {
            return View(model);
        }
    }
}
