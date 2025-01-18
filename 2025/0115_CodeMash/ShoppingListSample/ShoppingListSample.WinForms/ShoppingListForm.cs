using ShoppingListSample.Shared;
using System;
using System.ComponentModel;
using System.Windows.Forms;

namespace ShoppingListSample.WinForms
{
    public partial class ShoppingListForm : Form
    {
        private BindingList<Item> items;
        private IList<Category> categories;

        public ShoppingListForm()
        {
            InitializeComponent();
            categories = ShoppingListHelpers.CreateCategories();
            items = new BindingList<Item>(ShoppingListHelpers.CreateDemoShoppingListItems())
            {
                RaiseListChangedEvents = true
            };

            itemsDataGridView.DataSource = items;
            categoryComboBox.DataSource = categories;
            categoryComboBox.SelectedIndex = -1;
        }

        private void addItemButton_Click(object sender, EventArgs e)
        {
            var newItem = new Item { Name = nameTextBox.Text, IsComplete = false, Category = categoryComboBox.SelectedItem as Category };
            items.Add(newItem);
            ClearEntryFields();
        }

        private void ClearEntryFields()
        {
            nameTextBox.Text = string.Empty;
            categoryComboBox.SelectedIndex = -1;
        }

        private void deleteButton_Click(object sender, EventArgs e)
        {
            if (itemsDataGridView.SelectedRows.Count == 1 &&
                itemsDataGridView.SelectedRows[0].Index >= 0)
            {
                items.RemoveAt(itemsDataGridView.SelectedRows[0].Index);
            }
        }

        private void itemsDataGridView_SelectionChanged(object sender, EventArgs e)
        {
            if (itemsDataGridView.SelectedRows.Count == 1 &&
                itemsDataGridView.SelectedRows[0].Index >= 0)
            {
                deleteButton.Enabled = true;
            }
            else
            {
                deleteButton.Enabled = false;
            }
        }
    }
}