using ShoppingListSample.Shared;
using System.Collections.ObjectModel;

namespace ShoppingListSample.Maui
{
    public partial class MainPage : ContentPage
    {
        public IList<Category> Categories { get; set; }
        public ObservableCollection<Item> Items { get; set; }

        public MainPage()
        {
            InitializeComponent();
            Categories = ShoppingListHelpers.CreateCategories();
            Items = new ObservableCollection<Item>(ShoppingListHelpers.CreateDemoShoppingListItems());
            BindingContext = this;
        }

        private void addButton_Click(object sender, EventArgs e)
        {
            if (categoryPicker.SelectedItem is not Category category || string.IsNullOrWhiteSpace(nameEntry.Text))
            {
                validationMessage.IsVisible = true;
                return;
            }

            validationMessage.IsVisible = false;
            var newItem = new Item { Name = nameEntry.Text, IsComplete = false, Category = category };
            Items.Add(newItem);
            ClearEntryFields();
        }

        private void deleteButton_Click(object sender, EventArgs e)
        {
            var item = (Item)((Button)sender).BindingContext;
            Items.Remove(item);
        }

        private void ClearEntryFields()
        {
            nameEntry.Text = string.Empty;
            categoryPicker.SelectedIndex = -1;
        }
    }

}
