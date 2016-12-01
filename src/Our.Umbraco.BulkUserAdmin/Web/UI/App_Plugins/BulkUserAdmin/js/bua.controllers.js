angular.module("umbraco").controller("Our.Umbraco.BulkUserAdmin.DashboardController", [

    "$scope",
    "$rootScope",
    "$location",
    "dialogService",
    "listViewHelper",
    "notificationsService",
    "Our.Umbraco.BulkUserAdmin.Resources",

    function ($scope, $rootScope, $location, dialogService, listViewHelper, notificationsService, buaResources) {
        $scope.selectedUsers = [];
        $scope.actionInProgress = false;

        $scope.sortOptions = {
            orderBy: "name",
            orderDirection: "asc"
        };

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
            onSort: function (field, allow, isSystem) {
                $scope.sortOptions.orderBy = field;

                if ($scope.sortOptions.orderDirection === "desc") {
                    $scope.sortOptions.orderDirection = "asc";
                }
                else {
                    $scope.sortOptions.orderDirection = "desc";
                }
                goToPage(1);
            },
            isSortDirection(col, direction) {
                return listViewHelper.setSortingDirection(col, direction, $scope.sortOptions);
            },
            isSelectedAll: function () {
                return listViewHelper.isSelectedAll($scope.users.items, $scope.selectedUsers);
            },
            bulkActionsAllowed: 1,
        };

        $scope.paginationOptions = {
            prev: function () {
                if ($scope.users.pageNumber > 0) {
                    goToPage($scope.users.pageNumber - 1);
                }
            },
            next: function () {
                if ($scope.users.pageNumber <= $scope.users.totalPages) {
                    goToPage($scope.users.pageNumber + 1);
                }
            },
            goToPage: function (idx) {
                goToPage(idx);
            }
        };

        $scope.isAnythingSelected = function () {
            return $scope.selectedItemsCount() > 0;
        }

        $scope.selectedItemsCount = function () {
            return $scope.selectedUsers.length;
        }
        $scope.clearSelection = function () {
            listViewHelper.clearSelection($scope.users.items, null, $scope.selectedUsers);
        }


        $scope.searchOptions = {
            filter: ''
        };

        var searchListView = _.debounce(function () {
            $scope.$apply(function () {
                makeSearch();
            });
        }, 500);

        $scope.forceSearch = function (ev) {
            //13: enter
            switch (ev.keyCode) {
                case 13:
                    makeSearch();
                    break;
            }
        };

        $scope.enterSearch = function () {
            searchListView();
        };

        function makeSearch() {
            if ($scope.searchOptions.filter !== null && $scope.searchOptions.filter !== undefined) {
                goToPage(1);
            }
        }

        $scope.doUpdate = function () {
            if ($scope.selectedUsers.length > 0) {
                $scope.actionInProgress = true;

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
                            goToPage(1);
                        } else {
                            notificationsService.error("Error Updating", "There was an error updating the users, please try again.");
                        }
                    },
                    closeCallback: function () {
                        $scope.actionInProgress = false;
                    }
                });
            }
        };


        $scope.doDelete = function () {
            if (confirm("Are you sure you want to delete the selected " + $scope.selectedUsers.length + " users?")) {
                $scope.actionInProgress = true;
                var data = {
                    userIds: _.map($scope.selectedUsers, function (itm) {
                        return itm.id;
                    })
                };

                buaResources.deleteUsers(data).then(function () {
                    notificationsService.success("Users Updated", "All users were successfully deleted.");
                    goToPage(1);
                });
            }
        }

        var goToPage = function (idx) {
            $scope.actionInProgress = false;

            if ($scope.isAnythingSelected()) {
                $scope.clearSelection();
            }

            buaResources.getUsers(idx, $scope.sortOptions, $scope.searchOptions.filter).then(function (data) {
                $scope.users = data;
                $scope.users.pageNumber++;
            });
        };

        goToPage(1);
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