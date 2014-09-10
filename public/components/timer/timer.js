angular.module('Timer', [])
    .directive('timer', ['$interval', function($interval) {
        return {
            restrict: 'E',
            scope: true,
            transclude: true,
            templateUrl: '../components/timer/timer.html',
            link: function(scope) {
                scope.revealTime = new Date(2014, 8, 11, 19, 0, 0, 0).getTime();

                var timerPromise = $interval(function() {
                    scope.presentIsVisible = false;
                    scope.timestamp = scope.revealTime - Date.now();
                    scope.date = new Date(scope.timestamp);

                    if(scope.timestamp <= 0) {
                        $interval.cancel(timerPromise);
                        timerPromise = undefined;
                        scope.presentIsVisible = true;
                    }
                }, 1000);

                scope.$on('$destroy', function() {
                    if(angular.isDefined(timerPromise)) {
                        $interval.cancel(timerPromise);
                        timerPromise = undefined;
                    }
                });
            }
        };
}]);