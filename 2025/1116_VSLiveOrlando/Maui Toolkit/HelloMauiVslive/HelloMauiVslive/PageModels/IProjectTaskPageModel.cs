using CommunityToolkit.Mvvm.Input;
using HelloMauiVslive.Models;

namespace HelloMauiVslive.PageModels
{
    public interface IProjectTaskPageModel
    {
        IAsyncRelayCommand<ProjectTask> NavigateToTaskCommand { get; }
        bool IsBusy { get; }
    }
}