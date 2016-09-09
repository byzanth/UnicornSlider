module.exports = function(grunt) {
    grunt.initConfig({
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: ['unicornslider.min.css'],
                    dest: 'demo/css/'
                },
                {
                    expand: true,
                    cwd: '',
                    src: ['jquery.unicornslider.min.js'],
                    dest: 'demo/js/'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['copy']);
};