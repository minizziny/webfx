module.exports = function(config){
  config.set({

    basePath : '../',

    files : [
      'lib/angular/angular-1.2.16.js',
      'lib/angular/angular-route.js',
      'lib/angular/angular-translate.js',
      'lib/jquery/jquery-2.0.3.js',
      'bower_components/angular-mocks/angular-mocks.js',
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