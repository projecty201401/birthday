'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
        'ngRoute',
        'Home',
        'Tabgroup',
        'Timer',
        'Auth',
        'ngResource'
    ]).
    config(['$routeProvider', '$httpProvider', '$locationProvider', function($routeProvider, $httpProvider, $locationProvider) {
        $routeProvider.otherwise({redirectTo: '/'});

        $locationProvider.html5Mode(true);
        $httpProvider.interceptors.push('AuthInterceptor');
    }])

    .run(function(AuthService) {
        // call checkAuth to get the server authentication state
        AuthService.checkAuth();
    });
