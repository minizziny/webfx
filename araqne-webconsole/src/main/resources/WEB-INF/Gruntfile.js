/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    useminPrepare: {
      html: ['package/**/*.html', '../../../../../../logpresso/logpresso-ui/src/main/resources/WEB-INF/package/**/*.html']
    },
    usemin: {
      html: ['<%= useminPrepare.html%>']
    },
    // Metadata.
    // pkg: grunt.file.readJSON('package.json'),
    // banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
    //   '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
    //   '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
    //   '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
    //   ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    // concat: {
    //   /*
    //   options: {
    //     banner: '<%= banner %>',
    //     stripBanners: true
    //   },
    //   dist: {
    //     src: ['lib/<%= pkg.name %>.js'],
    //     dest: 'dist/<%= pkg.name %>.js'
    //   }
    //   */
    //   scripts: {
    //     options: {
    //       seperator: ';'
    //     },
    //     dest: './script/app.dist.js',
    //     src: [
    //       'bower_components/jquery/jquery.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.core.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.widget.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.mouse.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.position.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.draggable.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.droppable.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.resizable.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.selectable.js',
    //       'bower_components/jquery-ui/ui/jquery.ui.sortable.js',
    //       'bower_components/angular/angular.js',
    //       'bower_components/d3/d3.js',
    //       'bootstrap/js/bootstrap.js',
    //       'bower_components/moment/moment.js',
    //       'bower_components/moment/min/lang/ko.js',
    //       'script/app.js',
    //       'script/filter/**/*.js',
    //       'script/service/**/*.js',
    //       'script/directive/**/*.js'
    //     ]
    //   }
    // },
    // uglify: {
    //   options: {
    //     banner: '<%= banner %>'
    //   },
    //   dist: {
    //     src: '<%= concat.dist.dest %>',
    //     dest: 'dist/<%= pkg.name %>.min.js'
    //   }
    // },
    // jshint: {
    //   options: {
    //     curly: true,
    //     eqeqeq: true,
    //     immed: true,
    //     latedef: true,
    //     newcap: true,
    //     noarg: true,
    //     sub: true,
    //     undef: true,
    //     unused: true,
    //     boss: true,
    //     eqnull: true,
    //     browser: true,
    //     globals: {
    //       jQuery: true
    //     }
    //   },
    //   gruntfile: {
    //     src: 'Gruntfile.js'
    //   },
    //   lib_test: {
    //     src: ['lib/**/*.js', 'test/**/*.js']
    //   }
    // },
    // qunit: {
    //   files: ['test/**/*.html']
    // },
    // watch: {
    //   gruntfile: {
    //     files: '<%= jshint.gruntfile.src %>',
    //     tasks: ['jshint:gruntfile']
    //   },
    //   lib_test: {
    //     files: '<%= jshint.lib_test.src %>',
    //     tasks: ['jshint:lib_test', 'qunit']
    //   }
    // }
  });

  // These plugins provide necessary tasks.
  // grunt.loadNpmTasks('grunt-contrib-concat');
  // grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  // grunt.loadNpmTasks('grunt-contrib-jshint');
  // grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-usemin');

  // Default task.
  //grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);
  grunt.registerTask('default', ['useminPrepare', 'concat']);

};
