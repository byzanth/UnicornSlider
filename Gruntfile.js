module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            compass: {
                files: ['unicornslider.scss'],
                tasks: ['compass:main','copy']
            },
            js: {
                files: ['jquery.unicornslider.js'],
                tasks: ['uglify','copy']
            }
        },
        compass: {
            main: {
                options: {
                    sourcemap: false,
                    sassDir: ['.'],
                    cssDir: ['.'],
                    environment: 'production',
                    outputStyle: "compressed",
                    force: true
                },
                files: [
                    {
                        src: 'unicornslider.scss',
                        dest: 'unicornslider.min.css'
                    }
                ]
            }
        },
        uglify: {
            main: {
                files: {
                    'jquery.unicornslider.min.js': ['jquery.unicornslider.js']
                }
            }
        },
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
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['compass:main', 'uglify', 'copy']);
};