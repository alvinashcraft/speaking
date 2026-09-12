using HelloMauiVSLive.Models;
using HelloMauiVSLive.PageModels;

namespace HelloMauiVSLive.Pages
{
    public partial class ProjectDetailPage : ContentPage
    {
        public ProjectDetailPage(ProjectDetailPageModel model)
        {
            InitializeComponent();

            BindingContext = model;
        }
    }
}
