namespace Our.Umbraco.BulkUserAdmin.Models
{
    public class BulkUserUpdateModel
    {
        public int[] UserIds { get; set; }

        public bool UpdateUserType { get; set; }

        public bool UpdateUmbracoAccess { get; set; }

        public bool UpdateUserActive { get; set; }

        public bool UpdateStartContentNode { get; set; }

        public bool UpdateStartMediaNode { get; set; }

        public bool UpdateSections { get; set; }

        public bool UpdateLanguage { get; set; }

        public int UserTypeId { get; set; }

        public bool DisableUmbracoAccess { get; set; }

        public bool DisableUser { get; set; }

        public int StartContentNodeId { get; set; }

        public int StartMediaNodeId { get; set; }

        public string[] Sections { get; set; }

        public string Language { get; set; }
    }
}