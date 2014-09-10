'use strict';

angular.module('Auth', [])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'components/auth/login.html',
            controller: 'LoginCtrl',
            controllerAs: 'loginCtrl'
        })
    }])
    .controller('LoginCtrl', ['$scope', '$rootScope', 'AuthService', '$location', function($scope, $rootScope, AuthService, $location) {
        'use strict';

        $rootScope.cssClass = 'login-page';

        $scope.credentials = {
            username: '',
            password: ''
        };

        $scope.login = function() {
            AuthService.authenticate($scope.credentials, true)
                .then(function() {
                    $scope.reset();
                    $location.path('/');
                }).catch(function(err) {
                    console.error('authentication error:', err);
                    $scope.reset();
                    $scope.message = err;
                });
        };

        $scope.reset = function() {
            $scope.form.$setPristine();
            $scope.credentials.username = '';
            $scope.credentials.password = '';
            $scope.message = false;
        };
    }])
    .controller('RegisterCtrl', function($location, $rootScope, $scope, AuthService, User) {
        'use strict';

        $scope.error = false;
        $scope.newUser = {};

        // redirect if user is logged in (no need to setup an account)
        if($scope.user) {
            $location.path('/');
        }

        $scope.register = function() {
            User.create($scope.newUser).$promise
                .then(function() {
                    $scope.success = true;
                }).catch(function(err) {
                    console.error('cannot register or authenticate:', err);
                    $scope.error = err;
                });
        };

        $scope.reset = function() {
            $scope.form.$setPristine();
            $scope.error = false;
            $scope.newUser = {};
        };

    })
    .factory('User', function($resource) {
        'use strict';

        return $resource('/api/v1/user/:id',
            { id: '@_id' }, {
                getAll: { method: 'GET', isArray: true },
                get: { method: 'GET' },
                create: { method: 'POST' },
                save: { method: 'PUT' },
                changePw: { method: 'POST', url: '/api/v1/user/:id/change-pw' },
                remove: { method: 'DELETE' }
            }
        );
    })
    .factory('AuthService', ['$http', '$location', '$q', '$rootScope', function($http, $location, $q, $rootScope) {
        'use strict';

        var defaultRoute = '/';
        var routeCache;

        /**
         * Authenticates a user on the server.
         * If authentication is successful the user object in $rootScope will be set and an login event ('yf:login') with
         * the user object will be broadcasted.
         * With the redirect flag set a redirection will take place after a successful authentication either to an
         * previously cached route (see checkAuth) or to a default route.
         * @param credentials {object} object hash which must have the keys username and password with the credentials as
         * Strings
         * @param redirect {Boolean} flag to determine if a redirection should take place after successful authentication
         * @returns {Promise} promise object which is resolved with the user object or rejected with the error object
         */
        function authenticate(credentials, redirect) {
            var deferred = $q.defer();

            $http.post('/api/v1/login', JSON.stringify(credentials))
                .success(function(data, status) {
                    if (status === 200 || status === 204) {
                        setUser(data);
                        deferred.resolve(data);

                        if (redirect) {
                            $location.url((routeCache || defaultRoute));
                            routeCache = null;
                        }
                    }
                    deferred.reject(data);
                }).error(function(data) {
                    deferred.reject(data);
                }
            );

            return deferred.promise;
        }

        /**
         * Revokes authentication on server. Additionally the user object in $rootScope will be invalidated and a logout
         * event ('bday:logout') will be broadcasted.
         * @returns {Promise} promise object
         */
        function revokeAuth() {
            var deferred = $q.defer();

            $http.post('/api/v1/logout', {})
                .success(function(data, status) {
                    if (status === 200 || status === 204) {
                        resetUser();
                        deferred.resolve(data);
                    }
                    deferred.reject(data);
                }).error(deferred.reject);

            return deferred.promise;
        }

        /**
         * Checks the authentication status via a server request.
         * If the status changes from authenticated to not authenticated, an logout ('yf:logout') event will be broadcasted
         * and the user object in the $rootScope will be invalidated.
         * Otherwise if status goes from unauthenticated to authenticated an login even ('yf:login') with the user object
         * will be broadcasted and the user object in the $rootScope will be set.
         * If the status remains unchanged nothing will happen.
         * With the cacheUrl flag set, the targeted URL will be stored, so that later when the authentication succeeds the
         * user can be redirected to the page he wanted actually visit. Route caching takes only place when checkAuth fails.
         * @param cacheUrl {Boolean} (optional) flag to set if targeted URL should be cached
         * @returns {Promise} promise object
         */
        function checkAuth(cacheUrl) {
            var deferred = $q.defer();

            var url = $location.url();

            $http.get('/api/v1/ping')
                .success(function(data, status) {
                    if (data && status === 200) {
                        setUser(data);
                        deferred.resolve(data);
                    } else {
                        deferred.reject();
                        // do a logout if we were logged in when the auth check failed
                        resetUser();

                        if (cacheUrl) {
                            routeCache = url;
                            $location.url('/login');
                        }
                    }
                }).error(deferred.reject);

            return deferred.promise;
        }


        /* bind logout and activate function to the $rootScope for easy access */

        $rootScope.logout = function() {
            revokeAuth();
        };


        /* listen for 401 errors */

        $rootScope.$on('bday:401-error', function() {
            resetUser();
            $location.url('/login');
        });

        /* private helpers */

        function setUser(user) {
            if (!$rootScope.user) {
                $rootScope.user = user;
                $rootScope.$broadcast('bday:login', user);
            }
        }

        function resetUser() {
            if ($rootScope.user) {
                $rootScope.user = null;
                $rootScope.$broadcast('bday:logout');
            }
        }

        return {
            authenticate: authenticate,
            checkAuth: checkAuth,
            revokeAuth: revokeAuth
        };
    }])

    .factory('AuthInterceptor', ['$q', '$rootScope', function($q, $rootScope) {
        return {
            responseError: function(res) {
                if (res.status === 401) {
                    $rootScope.$broadcast('bday:401-error');
                }

                return $q.reject(res);
            }
        };
    }]);