using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Our.Umbraco.BulkUserAdmin.Web
{
    internal static class GenericCollectionOrderByExtensions
    {
        public static IEnumerable<T> OrderBy<T>(this IEnumerable<T> items, string propertyName, BulkUserAdminApiConstants.OrderByDirections direction)
        {
            var type = typeof(T);
            var property = type.GetProperty(propertyName);

            if (property == null)
            {
                throw new Exception(string.Format("Unable to find property named, \"{0}\".", propertyName));
            }

            Func<T, object> orderByLambda = (item) => property.GetValue(item);

            switch (direction)
            {
                case BulkUserAdminApiConstants.OrderByDirections.Descending:
                    return items.OrderByDescending(orderByLambda);
                default:
                    return items.OrderBy(orderByLambda);
            }
        }
    }
}
