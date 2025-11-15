namespace MauiMvvmToolkitApp
{
    public class Category
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public override string ToString()
        {
            return Name;
        }
    }
}