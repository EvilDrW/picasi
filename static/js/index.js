/* jshint esversion: 6 */

var app = angular.module('picasi', ['ngMaterial', 'ngMessages', 'leaflet-directive']);

app.controller('TestCtrl', ($scope, $http, $mdDialog, FilterService) => {
  FilterService.subscribe((filters) => {
    $http.get('/images', { params: filters })
    .then((res) => {
      $scope.imageIDs = res.data;
    })
    .catch((err) => {
      console.log(err);
    });
  });

  $scope.showImageDetail = (id) => {
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
});

app.controller('FilterController', function($scope, FilterService) {
  $scope.filters = {
    location: {},
    date: {},
    faces: {}
  };

  $scope.submit = () => {
    FilterService.clear();
    if ($scope.filters.date) {
      FilterService.set('datebegin', $scope.filters.date.begin.getTime());
      FilterService.set('dateend', $scope.filters.date.end.getTime());
    }
  };
});

app.service('FilterService', function() {
  var filters = {};
  var subscribers = [];

  this.subscribe = (cb) => {
    subscribers.push(cb);
    cb(filters);
  };

  this.clear = () => {
    filters = {};
  };

  this.set = (key, val) => {
    filters[key] = val;

    subscribers.forEach((cb) => {
      cb(filters);
    });
  };
});
