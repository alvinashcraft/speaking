namespace ShoppingListSample.Shared
{
    public class Item
    {
        public Item()
        {
            Name = string.Empty;
            Category = new Category();
        }
        public string Name { get; set; }
        public virtual Category Category { get; set; }
        public bool IsComplete { get; set; }
        public override string ToString()
        {
            return Name;
        }
    }
}