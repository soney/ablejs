module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: package,
		jshint: {
			build: {
				src: "able.js"
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
						'<%= grunt.template.today("yyyy-mm-dd h:MM:ss TT") %> */',
				global_defs: {
					DEBUG: false
				}
			},
			build: {
				src: "able.js",
				dest: "able.min.js"
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	// Default task(s).
	grunt.registerTask('default', ['jshint', 'uglify']);
};
