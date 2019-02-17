/* jshint esversion: 6 */

var app = angular.module('picasi', ['ngMaterial', 'ngMessages', 'leaflet-directive']);

app.directive('imageGrid', ($http, $mdDialog, FilterService) => {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'directives/imageGrid.html',
    link: (scope, ele, attrs) => {
      FilterService.subscribe('/images', (data) => {
        scope.imageIDs = data;
      });

      scope.showImageDetail = (id) => {
        $mdDialog.show({
          controller: function($http, $scope, $mdDialog, leafletData) {
            $http.get(`/images/${id}/metadata`)
            .then((res) => {
              $scope.metadata = res.data;

              $scope.markers = {
                m1: {
                  lng: res.data.location.coordinates[0],
                  lat: res.data.location.coordinates[1],
                  focus: true
                }
              };

              $scope.cancel = () => {
                $mdDialog.cancel();
              };
            });
          },
          templateUrl: 'directives/imagePanel.html'
        });
      };
    }
  };
});

app.directive('filterSetup', function($mdToast, FilterService) {
  return {
    restrict: 'E',
    templateUrl: 'directives/filterSetup.html',
    scope: true,
    link: (scope, ele, attrs) => {
      scope.filters = {
        location: {},
        date: {},
        faces: {}
      };

      scope.submit = () => {
        if (scope.filters.date) {
          FilterService.set({
            datebegin: scope.filters.date.begin.getTime(),
            dateend: scope.filters.date.end.getTime()
          });
        }
      };

      FilterService.subscribe('images/count', (count) => {
        $mdToast.show(
          $mdToast.simple()
          .textContent(`Found ${count} photos`)
          .position('bottom right')
          .hideDelay(3000));
      });
    }
  };
});

app.service('FilterService', function($http) {
  var filters = {};
  var subscribers = [];

  var notifySubscriber = (sub) => {
    $http.get(sub.url, { params: filters }).then((res) => {
      sub.callback(res.data);
    });
  };

  this.subscribe = (url, cb) => {
    subscribers.push({ url: url, callback: cb });
    notifySubscriber(subscribers[subscribers.length-1]);
  };

  this.set = (newFilters) => {
    filters = newFilters;
    subscribers.forEach(notifySubscriber);
  };
});
