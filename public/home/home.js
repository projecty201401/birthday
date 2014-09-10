'use strict';

angular.module('Home', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'home/index.html',
            controller: 'HomeCtrl',
            controllerAs: 'homeCtrl',
            resolve: {
                checkAuth: checkAuth
            }
        });

        function checkAuth(AuthService) {
            return AuthService.checkAuth(true);
        }
    }])

    .controller('HomeCtrl', ['$scope', 'AuthService', '$location', '$anchorScroll', function($scope, AuthService, $location, $anchorScroll) {
        $scope.logout = function() {
            AuthService.revokeAuth();
        };

        $scope.goToIntro = function() {
            $location.hash('intro');
            $anchorScroll();
        };
    }]);