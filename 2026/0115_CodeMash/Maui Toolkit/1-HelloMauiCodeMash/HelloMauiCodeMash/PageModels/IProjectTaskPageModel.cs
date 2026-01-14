using CommunityToolkit.Mvvm.Input;
using HelloMauiCodeMash.Models;

namespace HelloMauiCodeMash.PageModels
{
    public interface IProjectTaskPageModel
    {
        IAsyncRelayCommand<ProjectTask> NavigateToTaskCommand { get; }
        bool IsBusy { get; }
    }
}