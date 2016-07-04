angular.module("umbraco.resources").factory("Our.Umbraco.BulkUserAdmin.Resources",
    function ($q, $http, umbRequestHelper) {
        return {
            getUsers: function (page, sortOptions, filter) {
                var url = "/umbraco/backoffice/api/BulkUserAdminApi/GetUsers";
                return umbRequestHelper.resourcePromise(
                    $http({
                        url: url,
                        method: "GET",
                        params: {
                            p: page,
                            prop: sortOptions.propertyName,
                            dir: sortOptions.direction,
                            f: filter
                        }
                    }),
                    "Failed to get users"
                );
            },
            getUserTypes: function () {
                var url = "/umbraco/backoffice/api/BulkUserAdminApi/GetUserTypes";
                return umbRequestHelper.resourcePromise(
                    $http({
                        url: url,
                        method: "GET"
                    }),
                    "Failed to get user types"
                );
            },
            getSections: function () {
                var url = "/umbraco/backoffice/api/BulkUserAdminApi/GetSections";
                return umbRequestHelper.resourcePromise(
                    $http({
                        url: url,
                        method: "GET"
                    }),
                    "Failed to get sections"
                );
            },
            updateUsers: function (data) {
                var url = "/umbraco/backoffice/api/BulkUserAdminApi/UpdateUsers";
                return umbRequestHelper.resourcePromise(
                    $http({
                        url: url,
                        method: "POST",
                        data: data
                    }),
                    "Failed to update users"
                );
            },
            deleteUsers: function (data) {
                var url = "/umbraco/backoffice/api/BulkUserAdminApi/DeleteUsers";
                return umbRequestHelper.resourcePromise(
                    $http({
                        url: url,
                        method: "POST",
                        data: data
                    }),
                    "Failed to delete users"
                );
            }
        };
    });
