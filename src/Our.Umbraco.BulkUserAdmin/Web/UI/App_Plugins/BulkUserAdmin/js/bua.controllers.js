angular.module("umbraco").controller("Our.Umbraco.BulkUserAdmin.DashboardController", [

    "$scope",
    "$rootScope",
    "$location",
    "dialogService",
    "listViewHelper",
    "notificationsService",
    "Our.Umbraco.BulkUserAdmin.Resources",

    function ($scope, $rootScope, $location, dialogService, listViewHelper, notificationsService, buaResources) {
        $scope.sortOptions = {
            propertyName: "Id",
            direction: "Ascending"
        };

        $scope.selectedUsers = [];

        $scope.tableOptions = {
            itemProperties: [
                   { alias: "email", header: "Email Address", isSystem: 0, allowSorting: 1 },
                   { alias: "userType", header: "User Type", isSystem: 0, allowSorting: 1 },
                   { alias: "active", header: "Active", isSystem: 0, allowSorting: 1 }
            ],
            onClick: function (item) {
                $location.path('users/framed/%2Fumbraco%2Fusers%2FeditUser.aspx?id=' + item.id);
            },
            onSelect: function selectItem(selectedItem, $index, $event) {
                listViewHelper.selectHandler(selectedItem, $index, $scope.users.items, $scope.selectedUsers, $event);
            },
            onSelectAll: function ($event) {
                listViewHelper.selectAllItems($scope.users.items, $scope.selectedUsers, $event);
            },
            isSelectedAll: function () {
                return listViewHelper.isSelectedAll($scope.users.items, $scope.selectedUsers);
            },
            bulkActionsAllowed: 1,
        }

        $scope.filter = "";

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
                return itm.alias == section.alias;
            }) !== undefined;
        };

        $scope.selectSection = function (section) {
            if (!$scope.isSelectedSection(section)) {
                $scope.selectedSections.push(section);
            } else {
                $scope.selectedSections = _.reject($scope.selectedSections, function (itm) {
                    return itm.alias == section.alias;
                });
            }
        };

        $scope.doUpdate = function () {
            var data = {

                userIds: _.map($scope.selectedUsers, function (itm) {
                    return itm.id;
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
                userTypeId: $scope.selectedUserType ? $scope.selectedUserType.id : undefined,
                disableUmbracoAccess: $scope.disableUmbracoAccess,
                disableUser: $scope.disableUser,
                startContentNodeId: $scope.selectedStartContentNode ? $scope.selectedStartContentNode.id : undefined,
                startMediaNodeId: $scope.selectedStartMediaNode ? $scope.selectedStartMediaNode.id : undefined,
                sections: _.map($scope.selectedSections, function (itm) {
                    return itm.alias;
                }),
                language: $scope.language ? $scope.language.name : undefined

            };

            buaResources.updateUsers(data).then(function () {
                $scope.submit(true);
            });
        };

        $scope.doDelete = function () {
            if (confirm("Are you sure you want to delete the selected " + $scope.selectedUsers.length + " users?")) {

                var data = {
                    userIds: _.map($scope.selectedUsers, function (itm) {
                        return itm.id;
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