'use strict';

angular.module('Tabgroup', [])
    .directive('tabgroup', function() {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: '../components/tabgroup/tabgroup.html',
            controller: function($scope) {
                $scope.tabs = [];

                this.addTab = function(tab) {
                    if($scope.tabs.length == 0) {
                        tab.selected = true;
                    }

                    $scope.tabs.push(tab);
                };

                $scope.select = function(tab) {
                    angular.forEach($scope.tabs, function(eachTab) {
                        eachTab.selected = angular.equals(tab, eachTab);
                    });
                };
            }
        };
    })
    .directive('tab', function() {
        return {
            restrict: 'E',
            scope: {
                title: '@',
                description: '@',
                icon: '@'
            },
            transclude: true,
            templateUrl: '../components/tabgroup/tab.html',
            require: '^tabgroup',
            link: function(scope, el, attrs, ctrl) {
                ctrl.addTab(scope);
            }
        };
    });