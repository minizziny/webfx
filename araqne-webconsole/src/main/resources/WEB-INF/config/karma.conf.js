basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'lib/sha1.js',
  'bower_components/jquery/jquery.js',
  'bower_components/jquery-ui/ui/jquery-ui.js',  
  'bower_components/angular/angular.js',
  'bower_components/d3/d3.js',
  'bootstrap/js/bootstrap.js',
  'bower_components/moment/moment.js',
  'bower_components/moment/min/lang/ko.js',
  'test/lib/angular-mocks.js',
  'script/app.js',
  'script/directive/**/*.js',
  'script/filter/**/*.js',
  'script/service/**/*.js',
  'package/system/dashboard/widget.js',
  'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};
