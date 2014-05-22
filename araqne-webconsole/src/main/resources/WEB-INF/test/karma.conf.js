module.exports = function(config){
  config.set({

    basePath : '../',

    files : [
      'lib/jquery/jquery-2.1.0.js',
      'lib/angular/angular-1.2.16.js',
      'lib/angular/angular-route.js',
      'lib/angular/angular-translate.js',
      'node_modules/ng-midway-tester/src/ngMidwayTester.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'lib/highcharts/highcharts.js',
      'script/service/*.js',
      'script/directive/*.js',
      'test/unit/**/*.js',
      {
        pattern:  'test/resources/*.json',
        watched:  true,
        served:   true,
        included: false
      }
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};