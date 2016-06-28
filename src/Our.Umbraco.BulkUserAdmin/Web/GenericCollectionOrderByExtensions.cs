using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Our.Umbraco.BulkUserAdmin.Web
{
    internal static class GenericCollectionOrderByExtensions
    {
        public static IEnumerable<T> OrderBy<T>(this IEnumerable<T> items, string propertyName, string direction)
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
                case ApiConstants.OrderByDirections.Ascending:
                    return items.OrderBy(orderByLambda);
                case ApiConstants.OrderByDirections.Descending:
                    return items.OrderByDescending(orderByLambda);
                default:
                    throw new NotSupportedException(string.Format("Direction \"{0}\" is not supported.", direction));
            }
        }
    }
}
