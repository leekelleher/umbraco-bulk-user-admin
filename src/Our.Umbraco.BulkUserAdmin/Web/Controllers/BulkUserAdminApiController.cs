using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using Our.Umbraco.BulkUserAdmin.Models;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Web.WebApi;
using Umbraco.Web.WebApi.Filters;

namespace Our.Umbraco.BulkUserAdmin.Web.Controllers
{
    [UmbracoApplicationAuthorize(Constants.Applications.Users)]
    public class BulkUserAdminApiController : UmbracoAuthorizedApiController
    {
        private const OrderByDirections DefaultOrderByDirection = OrderByDirections.Ascending;
        private const string DefaultOrderByPropertyName = "Name";

        [HttpGet]
        public PagedResult<object> GetUsers()
        {
            return this.GetUsers(0, DefaultOrderByPropertyName, DefaultOrderByDirection);
        }

        [HttpGet]
        public PagedResult<object> GetUsers(int p, string prop, OrderByDirections dir)
        {
            var pageSize = 1000;

            int total;
            var items = Services.UserService.GetAll(p, pageSize, out total)
                .Select(x => new
                {
                    x.Id,
                    x.Name,
                    x.Email,
                    UserType = x.UserType.Name,
                    Active = x.IsApproved && !x.IsLockedOut
                });

            var result = new PagedResult<object>(total, p, pageSize)
            {
                Items = items.OrderBy(prop, dir)
            };

            return result;
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