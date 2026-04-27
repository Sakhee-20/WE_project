/* global angular */
(function () {
  "use strict";

  angular.module("studyNestApp").controller("MainController", [
    "$scope",
    "$http",
    "$q",
    function ($scope, $http, $q) {
      $scope.title = "StudyNest AngularJS App";
      $scope.message = "Live dashboard stats from backend APIs.";
      $scope.loading = true;
      $scope.error = "";

      // Initial fallback values while loading
      $scope.stats = {
        totalNotes: 0,
        totalSubjects: 0,
        totalChapters: 0,
      };

      function asArray(value) {
        return Array.isArray(value) ? value : [];
      }

      $q
        .all([
          $http.get("/api/subjects", { withCredentials: true }),
          $http.get("/api/notes", { withCredentials: true }),
        ])
        .then(function (responses) {
          var subjects = asArray(responses[0].data);
          var notes = asArray(responses[1].data);
          var chapterCount = subjects.reduce(function (sum, subject) {
            if (!subject || !Array.isArray(subject.chapters)) return sum;
            return sum + subject.chapters.length;
          }, 0);

          $scope.stats.totalSubjects = subjects.length;
          $scope.stats.totalNotes = notes.length;
          $scope.stats.totalChapters = chapterCount;
          $scope.message = "Stats are synced with /api/subjects and /api/notes.";
        })
        .catch(function (err) {
          var status = err && err.status ? err.status : "unknown";
          $scope.error = "Could not fetch dashboard stats (status: " + status + ").";
          $scope.message = "Showing fallback values.";
        })
        .finally(function () {
          $scope.loading = false;
        });
    },
  ]);
})();
