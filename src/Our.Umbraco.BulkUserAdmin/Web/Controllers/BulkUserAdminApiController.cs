using System.Collections.Generic;
using System.Linq;
using System.Web.Configuration;
using System.Web.Http;
using Our.Umbraco.BulkUserAdmin.Models;
using Our.Umbraco.BulkUserAdmin.Web.Common;
using Our.Umbraco.BulkUserAdmin.Web.Extensions;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Core.Models.Membership;
using Umbraco.Web.WebApi;
using Umbraco.Web.WebApi.Filters;

namespace Our.Umbraco.BulkUserAdmin.Web.Controllers
{
    [UmbracoApplicationAuthorize(Constants.Applications.Users)]
    [JsonCamelCaseFormatter]
    public class BulkUserAdminApiController : UmbracoAuthorizedApiController
    {
        private const int DefaultPageSize = 50;

        private const OrderByDirections DefaultOrderByDirection = OrderByDirections.Ascending;
        private const string DefaultOrderByPropertyName = "Id";
        private const string DefaultFilter = "";

        private const string FilterTermActive = "is:active";
        private const string FilterTermInactive = "is:inactive";

        private const string UserIconClassName = "icon-user";

        [HttpGet]
        public PagedResult<object> GetUsers()
        {
            return this.GetUsers(0, DefaultOrderByPropertyName, DefaultOrderByDirection, DefaultFilter);
        }

        [HttpGet]
        public PagedResult<object> GetUsers(
            int p,
            string prop,
            OrderByDirections dir,
            string f)
        {
            int pageSize = GetPageSize();

            int total;
            var items = Services
                .UserService
                .GetAll(0, int.MaxValue, out total);

            if (!string.IsNullOrWhiteSpace(f))
            {
                var filteredItems = FilterUsers(items, f);

                return GetOrderedPagedResult(filteredItems, p, pageSize, filteredItems.Count(), prop, dir);
            }

            return GetOrderedPagedResult(items, p, pageSize, total, prop, dir);
        }

        private IEnumerable<IUser> FilterUsers(IEnumerable<IUser> items, string filter)
        {
            foreach (var item in items)
            {
                if (item.Name.InvariantContains(filter))
                {
                    yield return item;
                    continue;
                }

                if (item.Email.InvariantContains(filter))
                {
                    yield return item;
                    continue;
                }

                if (item.UserType != null && item.UserType.Name.InvariantContains(filter))
                {
                    yield return item;
                    continue;
                }

                var isActive = item.IsApproved && !item.IsLockedOut;
                if (filter.InvariantEquals(isActive ? FilterTermActive : FilterTermInactive))
                {
                    yield return item;
                    continue;
                }
            }
        }

        private PagedResult<object> GetOrderedPagedResult(
            IEnumerable<IUser> items,
            int page,
            int pageSize,
            int total,
            string property,
            OrderByDirections direction)
        {
            return new PagedResult<object>(total, page, pageSize)
            {
                Items = items
                    .Select(x => new
                    {
                        Icon = UserIconClassName,
                        Id = x.Id,
                        Name = x.Name,
                        Email = x.Email,
                        UserType = x.UserType.Name,
                        Active = x.IsApproved && !x.IsLockedOut
                    })
                    .OrderBy(property, direction)
                    .Skip(page * pageSize)
                    .Take(pageSize)
            };
        }

        private int GetPageSize()
        {
            var appSettingKey = "BulkUserAdmin:PageSize";
            if (WebConfigurationManager.AppSettings.AllKeys.InvariantContains(appSettingKey))
            {
                int pageSize;
                if (int.TryParse(WebConfigurationManager.AppSettings[appSettingKey], out pageSize) && pageSize > 0)
                {
                    return pageSize;
                }
            }

            return DefaultPageSize;
        }

        [HttpGet]
        public IEnumerable<object> GetUserTypes()
        {
            return Services.UserService.GetAllUserTypes().OrderBy(x => x.Name).Select(x => new { x.Id, x.Name });
        }

        [HttpGet]
        public IEnumerable<object> GetSections()
        {
            return Services.SectionService.GetSections().OrderBy(x => x.SortOrder).Select(x => new { x.Alias, x.Name });
        }

        [HttpGet]
        public IEnumerable<object> GetLanguages()
        {
            return Services.TextService.GetSupportedCultures().OrderBy(x => x.DisplayName).Select(x => new { x.Name, x.DisplayName });
        }

        [HttpPost]
        public void UpdateUsers(BulkUserUpdateModel model)
        {
            var userType = model.UserTypeId > 0
                ? Services.UserService.GetUserTypeById(model.UserTypeId)
                : null;

            foreach (var userId in model.UserIds)
            {
                // Get the user
                var user = Services.UserService.GetUserById(userId);
                var changed = false;

                // Update data
                if (model.UpdateUserType && userType != null && user.UserType.Id != userType.Id)
                {
                    user.UserType = userType;
                    changed = true;
                }

                if (model.UpdateUmbracoAccess && user.IsLockedOut != model.DisableUmbracoAccess)
                {
                    user.IsLockedOut = model.DisableUmbracoAccess;
                    changed = true;
                }

                if (model.UpdateUserActive && user.IsApproved != (!model.DisableUser))
                {
                    user.IsApproved = !model.DisableUser;
                    changed = true;
                }

                if (model.UpdateStartContentNode && user.StartContentId != model.StartContentNodeId)
                {
                    user.StartContentId = model.StartContentNodeId;
                    changed = true;
                }

                if (model.UpdateStartMediaNode && user.StartMediaId != model.StartMediaNodeId)
                {
                    user.StartMediaId = model.StartMediaNodeId;
                    changed = true;
                }

                if (model.UpdateSections && !user.AllowedSections.OrderBy(x => x).SequenceEqual(model.Sections.OrderBy(x => x)))
                {
                    var removed = user.AllowedSections.Where(x => !model.Sections.Contains(x)).ToArray();
                    var added = model.Sections.Where(x => !user.AllowedSections.Contains(x)).ToArray();

                    foreach (var r in removed)
                    {
                        user.RemoveAllowedSection(r);
                    }

                    foreach (var a in added)
                    {
                        user.AddAllowedSection(a);
                    }

                    changed = true;
                }

                if (model.UpdateLanguage && user.Language != model.Language)
                {
                    user.Language = model.Language;

                    changed = true;
                }

                // Save the user
                if (changed)
                {
                    Services.UserService.Save(user);
                }
            }
        }

        [HttpPost]
        public void DeleteUsers(BulkUserUpdateModel model)
        {
            foreach (var userId in model.UserIds)
            {
                // Get the user
                var user = Services.UserService.GetUserById(userId);

                // Delete the user
                Services.UserService.Delete(user, true);
            }
        }
    }
}