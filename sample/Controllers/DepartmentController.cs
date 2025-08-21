using Microsoft.AspNetCore.Mvc;

namespace SampleMvcApp.Controllers
{
    public class DepartmentController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Edit(int id)
        {
            var viewModel = new DepartmentEditViewModel 
            { 
                Id = id, 
                Name = "Sample Department",
                Description = "Sample Description"
            };
            return View("DepartmentEdit", viewModel);
        }

        public IActionResult Create()
        {
            var viewModel = new DepartmentCreateViewModel();
            return View("DepartmentForm", viewModel);
        }

        public IActionResult Details(int id)
        {
            var model = GetDepartmentById(id);
            return View("DepartmentDetails", model);
        }

        public IActionResult GetDepartmentCard(int id)
        {
            var model = GetDepartmentById(id);
            return PartialView("_DepartmentCard", model);
        }

        public IActionResult GetDepartmentForm()
        {
            var viewModel = new DepartmentFormViewModel();
            return PartialView("_DepartmentForm", viewModel);
        }

        public IActionResult GetEditForm(int id)
        {
            var model = GetDepartmentById(id);
            return PartialView("_EditForm", model);
        }

        private DepartmentModel GetDepartmentById(int id)
        {
            return new DepartmentModel { Id = id, Name = $"Department {id}", Description = $"Description for department {id}" };
        }
    }

    public class DepartmentEditViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
    }

    public class DepartmentCreateViewModel
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
    }

    public class DepartmentFormViewModel
    {
        public string Title { get; set; } = "Department Form";
    }

    public class DepartmentModel
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
