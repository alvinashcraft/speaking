namespace ShoppingListSample.Shared
{
    public static class ShoppingListHelpers
    {
        public static IList<Category> CreateCategories()
        {
            return new List<Category>
            {
                new() { Name = "Produce", CategoryId = 1 },
                new() { Name = "Dairy", CategoryId = 2 },
                new() { Name = "Bakery", CategoryId = 3 },
                new() { Name = "Meat", CategoryId = 4 },
                new() { Name = "Frozen", CategoryId = 5 },
                new() { Name = "Canned", CategoryId = 6 },
                new() { Name = "Beverages", CategoryId = 7 },
                new() { Name = "Snacks", CategoryId = 8 }
            };
        }

        public static IList<Item> CreateDemoShoppingListItems()
        {
            return new List<Item>
            {
                new() { Name = "Apples", Category = new Category() { Name = "Produce" } },
                new() { Name = "Bananas", Category = new Category() { Name = "Produce" } },
                new() { Name = "Oranges", Category = new Category() { Name = "Produce" }, IsComplete = true },
                new() { Name = "Milk", Category = new Category() { Name = "Dairy" } },
                new() { Name = "Eggs", Category = new Category() { Name = "Dairy" }, IsComplete = true },
                new() { Name = "Bread", Category = new Category() { Name = "Bakery" }, IsComplete = true },
                new() { Name = "Chicken", Category = new Category() { Name = "Meat" } },
                new() { Name = "Beef", Category = new Category() { Name = "Meat" } },
                new() { Name = "Pork", Category = new Category() { Name = "Meat" }, IsComplete = true },
                new() { Name = "Ice Cream", Category = new Category() { Name = "Frozen" } }
            };
        }
    }
}