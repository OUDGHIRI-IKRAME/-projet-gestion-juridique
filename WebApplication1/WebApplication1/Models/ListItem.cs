namespace WebApplication1.Models
{
    public class ListItem
    {
        public int Id { get; set; }
        public string ListName { get; set; }
        public string Code { get; set; }
        public string ValueFr { get; set; }
        public string ValueAr { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
