﻿using System;
using System.Collections.Generic;
using System.Linq;
using Our.Umbraco.BulkUserAdmin.Web.Common;
using System.Reflection;

namespace Our.Umbraco.BulkUserAdmin.Web.Extensions
{
    internal static class EnumerableExtensions
    {
        public static IEnumerable<T> OrderBy<T>(this IEnumerable<T> items, string propertyName, OrderByDirections direction)
        {
            var type = typeof(T);
            var property = type.GetProperty(propertyName, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);

            if (property == null)
            {
                throw new Exception(string.Format("Unable to find property named, \"{0}\".", propertyName));
            }

            Func<T, object> orderByLambda = (item) => property.GetValue(item);

            switch (direction)
            {
                case OrderByDirections.Desc:
                    return items.OrderByDescending(orderByLambda);

                default:
                    return items.OrderBy(orderByLambda);
            }
        }
    }
}