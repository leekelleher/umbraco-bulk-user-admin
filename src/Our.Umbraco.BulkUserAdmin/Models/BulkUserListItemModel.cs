namespace Our.Umbraco.BulkUserAdmin.Models
{
    internal class BulkUserListItemModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Email { get; set; }

        public string UserType { get; set; }

        public bool Active { get; set; }
    }
}