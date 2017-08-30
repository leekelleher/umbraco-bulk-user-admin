angular.module("umbraco").controller("Our.Umbraco.BulkUserAdmin.DashboardController", [

    "$scope",
    "$rootScope",
    "$window",
    "dialogService",
    "notificationsService",
    "Our.Umbraco.BulkUserAdmin.Resources",

    function ($scope, $rootScope, $window, dialogService, notificationsService, buaResources) {
        $scope.sortOptions = {
            propertyName: "Id",
            direction: "Ascending"
        };

        $scope.filter = "";

        $scope.selectedUsers = [];

        $scope.prev = function () {
            if ($scope.users.pageNumber > 0) {
                $scope.goToPage($scope.users.pageNumber - 1, $scope.sortOptions, $scope.filter);
            }
        };

        $scope.next = function () {
            if ($scope.users.pageNumber + 1 < $scope.users.totalPages) {
                $scope.goToPage($scope.users.pageNumber + 1, $scope.sortOptions, $scope.filter);
            }
        };

        $scope.goToPage = function (idx, sortOptions, filter) {
            if (typeof (sortOptions) === 'undefined')
                sortOptions = $scope.sortOptions;

            if (typeof (filter) === 'undefined')
                filter = $scope.filter;

            buaResources.getUsers(idx, sortOptions, filter).then(function (data) {
                $scope.users = data;

                var pagniation = [];
                for (var i = 0; i < data.totalPages; i++) {
                    pagniation.push({
                        idx: i,
                        name: i + 1
                    });
                }

                $scope.pagination = pagniation;
            });
        };

        $scope.isSelected = function (usr) {
            return _.find($scope.selectedUsers, function (itm) {
                return itm.Id == usr.Id;
            }) !== undefined;
        };

        $scope.isSelectedAll = function () {
            return $scope.users !== undefined && _.every($scope.users.items, function (itm) {
                return !!_.find($scope.selectedUsers, function (itm2) {
                    return itm.Id == itm2.Id;
                });
            });
        };

        $scope.selectUser = function (usr) {
            if (!$scope.isSelected(usr)) {
                $scope.selectedUsers.push(usr);
            } else {
                $scope.selectedUsers = _.reject($scope.selectedUsers, function (itm) {
                    return itm.Id == usr.Id;
                });
            }
        };

        $scope.selectAll = function () {
            if (!$scope.isSelectedAll()) {
                _.each($scope.users.items, function (itm) {
                    if (!$scope.isSelected(itm)) {
                        $scope.selectUser(itm);
                    }
                });
            } else {
                _.each($scope.users.items, function (itm) {
                    if ($scope.isSelected(itm)) {
                        $scope.selectUser(itm);
                    }
                });
            }
        };

        $scope.doUpdate = function () {
            if ($scope.selectedUsers.length > 0) {
                dialogService.open({
                    options: {
                        selectedUsers: $scope.selectedUsers
                    },
                    template: "/App_Plugins/BulkUserAdmin/views/bua.dialog.html",
                    show: true,
                    callback: function (success) {
                        if (success) {
                            notificationsService.success("Users Updated", "All users were successfully updated.");
                            $scope.selectedUsers = [];
                            $scope.goToPage(0, $scope.sortOptions, $scope.filter);
                        } else {
                            notificationsService.error("Error Updating", "There was an error updating the users, please try again.");
                        }
                    }
                });
            }
        }

        $scope.sort = function (field) {
            $scope.sortOptions.propertyName = field;

            if ($scope.sortOptions.direction === "Descending") {
                $scope.sortOptions.direction = "Ascending";
            }
            else {
                $scope.sortOptions.direction = "Descending";
            }

            $scope.goToPage(0, $scope.sortOptions, $scope.filter);
        };

        $scope.isSortDirection = function (col, direction) {
            return $scope.sortOptions.propertyName.toUpperCase() == col.toUpperCase() && $scope.sortOptions.direction == direction;
        };

        $scope.enterSearch = function ($event) {
            $($event.target).next().focus();
        }

        $scope.search = function () {
            $scope.goToPage(0, $scope.sortOptions, $scope.filter);
        };

        $scope.goToPage(0, $scope.sortOptions, $scope.filter);
    }

]);

angular.module("umbraco").controller("Our.Umbraco.BulkUserAdmin.DialogController", [

    "$scope",
    "$rootScope",
    "Our.Umbraco.BulkUserAdmin.Resources",

    function ($scope, $rootScope, buaResources) {

        var opts = $scope.dialogOptions.options;

        $scope.updateUserType = false;
        $scope.updateUmbracoAccess = false;
        $scope.updateUserActive = false;
        $scope.updateStartContentNode = false;
        $scope.updateStartMediaNode = false;
        $scope.updateSections = false;
        $scope.updateLanguage = false;

        $scope.selectedUsers = opts.selectedUsers;
        $scope.selectedSections = [];

        $scope.isSelectedSection = function (section) {
            return _.find($scope.selectedSections, function (itm) {
                return itm.Alias == section.Alias;
            }) !== undefined;
        };

        $scope.selectSection = function (section) {
            if (!$scope.isSelectedSection(section)) {
                $scope.selectedSections.push(section);
            } else {
                $scope.selectedSections = _.reject($scope.selectedSections, function (itm) {
                    return itm.Alias == section.Alias;
                });
            }
        };

        $scope.doUpdate = function () {
            var data = {

                userIds: _.map($scope.selectedUsers, function (itm) {
                    return itm.Id;
                }),

                // Update flags
                updateUserType: $scope.updateUserType,
                updateUmbracoAccess: $scope.updateUmbracoAccess,
                updateUserActive: $scope.updateUserActive,
                updateStartContentNode: $scope.updateStartContentNode,
                updateStartMediaNode: $scope.updateStartMediaNode,
                updateSections: $scope.updateSections,
                updateLanguage: $scope.updateLanguage,

                // Update data
                userTypeId: $scope.selectedUserType ? $scope.selectedUserType.Id : undefined,
                disableUmbracoAccess: $scope.disableUmbracoAccess,
                disableUser: $scope.disableUser,
                startContentNodeId: $scope.selectedStartContentNode ? $scope.selectedStartContentNode.id : undefined,
                startMediaNodeId: $scope.selectedStartMediaNode ? $scope.selectedStartMediaNode.id : undefined,
                sections: _.map($scope.selectedSections, function (itm) {
                    return itm.Alias;
                }),
                language: $scope.language ? $scope.language.Name : undefined

            };

            buaResources.updateUsers(data).then(function () {
                $scope.submit(true);
            });
        };

        $scope.doDelete = function () {
            if (confirm("Are you sure you want to delete the selected " + $scope.selectedUsers.length + " users?")) {

                var data = {
                    userIds: _.map($scope.selectedUsers, function (itm) {
                        return itm.Id;
                    })
                };

                buaResources.deleteUsers(data).then(function () {
                    $scope.submit(true);
                });
            }
        }

        // Load data
        buaResources.getUserTypes().then(function (data) {
            $scope.userTypes = data;
            buaResources.getSections().then(function (data2) {
                $scope.sections = data2;
                buaResources.getLanguages().then(function (data3) {
                    $scope.languages = data3;
                });
            });
        });

    }

]);