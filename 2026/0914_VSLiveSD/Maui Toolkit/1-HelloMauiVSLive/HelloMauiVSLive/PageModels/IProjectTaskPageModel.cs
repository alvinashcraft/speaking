using CommunityToolkit.Mvvm.Input;
using HelloMauiVSLive.Models;

namespace HelloMauiVSLive.PageModels
{
    public interface IProjectTaskPageModel
    {
        IAsyncRelayCommand<ProjectTask> NavigateToTaskCommand { get; }
        bool IsBusy { get; }
    }
}