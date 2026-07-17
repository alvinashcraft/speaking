using System;
using System.Diagnostics;
using CommunityToolkit.Mvvm.ComponentModel;

namespace MauiCsharpMarkup;

public partial class MainViewModel : ObservableObject
{
        [ObservableProperty]
        private string name;
        partial void OnNameChanging(string value)
        {
            Debug.WriteLine($"Name is about to change to {value}");
        }
        partial void OnNameChanged(string value)
        {
            Debug.WriteLine($"Name has changed to {value}");
        }
}
