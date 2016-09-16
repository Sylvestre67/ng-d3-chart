module.exports = function(grunt) {
  require('jit-grunt')(grunt);
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    less: {
      development: {
        options: {
          compress: true,
          yuicompress: true,
          optimization: 2
        },
        files: {
		  "ng-d3-charts.min.css": "src/ng-d3-charts.less" // destination file and source file
        }
      }
    },

	uglify: {
	  my_target: {
		files: {
		  "ng-d3-charts.min.js": ["src/ng-d3-charts.js"]
		}
	  }
  	},

    watch: {
      styles: {
        files: ['src/*.js','src/ng-d3-chart.less'], // which files to watch
        tasks: ['less','uglify'],
        options: {
          nospawn: true,
		  livereload: true
        }
      }
    }
  });

  grunt.registerTask('default', ['less','uglify','watch']);

};
