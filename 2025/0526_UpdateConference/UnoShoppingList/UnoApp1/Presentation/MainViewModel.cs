using System.Collections.ObjectModel;
using UnoShoppingList.Models;

namespace UnoApp1.Presentation;

public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private IList<Category> categories;

    [ObservableProperty]
    private ObservableCollection<Item> items;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(AddCommand))]
    private string itemName = "";

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(AddCommand))]
    private Category selectedCategory;

    public MainViewModel()
    {
        Categories = ShoppingListHelpers.CreateCategories();
        Items = new ObservableCollection<Item>(ShoppingListHelpers.CreateDemoShoppingListItems());
    }

    [RelayCommand(CanExecute = nameof(CanAddItem))]
    private void Add()
    {
        var newItem = new Item { Name = ItemName, IsComplete = false, Category = SelectedCategory };
        Items.Add(newItem);
        ClearEntryFields();
    }

    private bool CanAddItem() => !string.IsNullOrEmpty(ItemName) && SelectedCategory != null;

    private void ClearEntryFields()
    {
        ItemName = string.Empty;
        SelectedCategory = null;
    }
}
