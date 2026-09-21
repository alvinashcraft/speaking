namespace ShoppingListSample.Shared
{
    public class Item
    {
        public string Name { get; set; } = string.Empty;
        public virtual Category Category { get; set; } = new Category();
        public bool IsComplete { get; set; }
        public override string ToString()
        {
            return Name;
        }
    }
}