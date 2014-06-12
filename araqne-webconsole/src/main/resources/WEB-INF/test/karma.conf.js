module.exports = function(config){
  config.set({

    basePath : '../',

    files : [
      'lib/jquery/jquery-2.1.0.js',
      'lib/angular/angular-1.2.16.js',
      'lib/angular/angular-route.js',
      'lib/angular/angular-translate.js',
      'lib/angular/angular-translate-loader-static-files.js',
      {
        pattern:  'locales/system.ko.json',
        watched:  true,
        served:   true,
        included: false
      },
      'lib/d3/d3.js',
      'lib/d3/d3.layout.cloud.js',
      'node_modules/ng-midway-tester/src/ngMidwayTester.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'lib/highcharts/highcharts.js',
      'script/service/service.connection.js',
      'script/service/service.utility.js',
      'script/service/service.chart.js',
      'script/directive/*.js',
      'script/filter/*.js',
      'test/unit/**/*.js',
      {
        pattern:  'test/resources/*.json',
        watched:  true,
        served:   true,
        included: false
      },
      'script/directive/*.html',
      'lib/bootstrap2/css/*',
      {
        pattern:  'lib/bootstrap2/img/*',
        watched:  true,
        served:   true,
        included: false
      },
      'css/ui-cronizer.css'
    ],

    preprocessors: {
      'script/directive/*.html': ['ng-html2js']
    },

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-ng-html2js-preprocessor'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};