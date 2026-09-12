using HelloMauiVSLive.PageModels;

namespace HelloMauiVSLive.Pages
{
    public partial class ProjectListPage : ContentPage
    {
        public ProjectListPage(ProjectListPageModel model)
        {
            BindingContext = model;
            InitializeComponent();
        }
    }
}