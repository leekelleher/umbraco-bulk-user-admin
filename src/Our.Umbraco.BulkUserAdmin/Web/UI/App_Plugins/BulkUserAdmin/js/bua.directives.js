angular.module('umbraco.directives').directive("umbNodePicker", [

    "dialogService",

    function (dialogService) {

        return {
            scope: {
                model: "=",
                section: "@",
                tree: "@"
            },
            restrict: 'E',
            replace: true,
            template: '<ul class="unstyled list-icons"><li ng-hide="model"><i class="icon icon-add blue"></i><a href ng-click="openPicker()" prevent-default><localize key="general_choose">Choose</localize>...</a></li><li ng-show="model"><i class="icon icon-delete red" ng-click="clear()" style="cursor: pointer;"></i><a href prevent-default ng-click="openPicker()" >{{model.name}}</a></li></ul>',
            link: function (scope, element, attrs, ctrl) {

                scope.openPicker = function() {
                    dialogService.treePicker({
                        section: scope.section,
                        treeAlias: scope.tree,
                        multiPicker: false,
                        callback: function (itm) {
                            scope.model = itm;
                        }
                    });
                }

                scope.clear = function () {
                    scope.model = undefined;
                }

            }
        };

    }

]);