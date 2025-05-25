namespace ShoppingListSample.Shared
{
    public class Category
    {
        public Category()
        {
            Name = string.Empty;
        }
        public int CategoryId { get; set; }
        public string Name { get; set; }
        public override string ToString()
        {
            return Name;
        }
    }
}