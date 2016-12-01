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
                $location.path('users/framed/%2Fumbraco%2Fusers%2FeditUser.aspx%3Fid%3D' + item.id);
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
            var selectedUsersCount = $scope.selectedItemsCount();

            var dialogCleanUp = function () {
                $scope.actionInProgress = false;
                $scope.updateDialog.show = false;
                $scope.updateDialog = null;
            }
            $scope.updateDialog = {
                dialogData: {
                    selectedUsers: $scope.selectedUsers
                }
            };
            $scope.updateDialog.view = "/App_Plugins/BulkUserAdmin/views/bua.dialog.html";
            $scope.updateDialog.show = true;

            $scope.updateDialog.title = "Update " + selectedUsersCount + " User" + (selectedUsersCount == 1 ? '' : 's');

            $scope.updateDialog.submit = function (model) {
                var dialogData = model.dialogData;

                if (dialogData) {
                    var data = {
                        userIds: _.map(dialogData.selectedUsers, function (itm) {
                            return itm.id;
                        }),

                        // Update flags
                        updateUserType: dialogData.updateUserType,
                        updateUmbracoAccess: dialogData.updateUmbracoAccess,
                        updateUserActive: dialogData.updateUserActive,
                        updateStartContentNode: dialogData.updateStartContentNode,
                        updateStartMediaNode: dialogData.updateStartMediaNode,
                        updateSections: dialogData.updateSections,
                        updateLanguage: dialogData.updateLanguage,

                        // Update data
                        userTypeId: dialogData.selectedUserType ? dialogData.selectedUserType.id : undefined,
                        disableUmbracoAccess: dialogData.disableUmbracoAccess,
                        disableUser: dialogData.disableUser,
                        startContentNodeId: dialogData.selectedStartContentNode ? dialogData.selectedStartContentNode.id : undefined,
                        startMediaNodeId: dialogData.selectedStartMediaNode ? dialogData.selectedStartMediaNode.id : undefined,
                        sections: _.map(dialogData.selectedSections, function (itm) {
                            return itm.alias;
                        }),
                        language: dialogData.language ? dialogData.language.name : undefined
                    };

                    buaResources.updateUsers(data).then(function () {
                        dialogCleanUp();
                        notificationsService.success("Users Updated", "All users were successfully updated.");
                        goToPage(1);
                    }, function () {
                        dialogCleanUp();
                        notificationsService.error("Error Updating", "There was an error updating the users, please try again.");
                    });
                }
            };

            $scope.updateDialog.close = function (oldModel) {
                dialogCleanUp();
            };
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
        $scope.model.dialogData.updateUserType = false;
        $scope.model.dialogData.updateUmbracoAccess = false;
        $scope.model.dialogData.updateUserActive = false;
        $scope.model.dialogData.updateStartContentNode = false;
        $scope.model.dialogData.updateStartMediaNode = false;
        $scope.model.dialogData.updateSections = false;
        $scope.model.dialogData.updateLanguage = false;

        $scope.model.dialogData.selectedSections = [];

        $scope.model.dialogData.isSelectedSection = function (section) {
            return _.find($scope.model.dialogData.selectedSections, function (itm) {
                return itm.alias == section.alias;
            }) !== undefined;
        };

        $scope.model.dialogData.selectSection = function (section) {
            if (!$scope.model.dialogData.isSelectedSection(section)) {
                $scope.model.dialogData.selectedSections.push(section);
            } else {
                $scope.model.dialogData.selectedSections = _.reject($scope.model.dialogData.selectedSections, function (itm) {
                    return itm.alias == section.alias;
                });
            }
        };

        // Load data
        buaResources.getUserTypes().then(function (data) {
            $scope.model.dialogData.userTypes = data;
            buaResources.getSections().then(function (data2) {
                $scope.model.dialogData.sections = data2;
                buaResources.getLanguages().then(function (data3) {
                    $scope.model.dialogData.languages = data3;
                });
            });
        });

        $scope.b
    }

]);