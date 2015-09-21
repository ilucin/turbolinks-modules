module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    clean: ['dist'],

    uglify: {
      min: {
        files: {
          'dist/turbolinks-modules.min.js': ['src/turbolinks-modules.js']
        }
      }
    }
  });

  grunt.registerTask('copy-src', function() {
    grunt.file.copy('src/turbolinks-modules.js', 'dist/turbolinks-modules.js');
  });

  grunt.registerTask('build', ['clean', 'uglify:min', 'copy-src']);
};
