# Sample MVC Projects

This folder contains sample ASP.NET Core MVC projects for testing the VS Code MVC Navigator extension.

## Projects Structure

### Main Sample Controllers and Views
- **ProductController**: Demonstrates product CRUD operations with various views and partial views
- **HomeController**: Basic home actions with different view types
- **ErrorController**: Error handling with different error views
- **UserController**: User information partial views
- **CommentController**: Comments listing partial views

### Project1
A comprehensive MVC project showcasing:
- **Models**: ProductModel, UserModel, CommentModel, ErrorViewModel
- **Controllers**: HomeController with various actions
- **Areas**: Admin area with UsersController
- **Views**: Standard views and partial views with proper model binding

### Project2
A focused e-commerce-style MVC project featuring:
- **Models**: ProductModel, CategoryModel
- **Controllers**: ProductController with List and Details actions
- **Areas**: Catalog area with ProductsController
- **Views**: Product listings and detail views

## Features Demonstrated

### Model Binding
- All views properly reference their respective models
- ViewModels for form operations (ProductEditViewModel, ProductCreateViewModel)
- Proper model namespacing and imports via _ViewImports.cshtml

### Controllers
- Standard action methods returning views and partial views
- Area controllers with proper [Area] attributes
- Model data passed to views consistently

### Views Structure
- **Standard Views**: Full page views with layout
- **Partial Views**: Reusable components prefixed with underscore (_)
- **Areas**: Organized views within area-specific folder structures
- **Shared Views**: Common partial views in Shared folders

### Partial Views Examples
- `_ProductCard`: Product display component
- `_ProductForm`: Product creation form
- `_EditForm`: Product editing form
- `_UserInfo`: User information display
- `_CommentsList`: Comments listing
- `_CategoryFilter`: Category filtering component (Project2)

### Areas Structure
- **Admin Area** (Project1): User management
- **Catalog Area** (Project2): Product catalog management

## Testing the Extension

These projects provide comprehensive examples for testing:
- Controller to View navigation
- View to Controller navigation
- Partial view references
- Area-based navigation
- Model references in views
- Different project structures within the same solution

All projects compile successfully and demonstrate proper MVC patterns and conventions.
