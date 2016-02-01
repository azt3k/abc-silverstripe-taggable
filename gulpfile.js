(function (gulp, gulpLoadPlugins) {

    'use strict';

    var $ = gulpLoadPlugins({ pattern: '*', lazy: true }),
        _ = {
            vendor: 'thirdparty',
            src: 'assets/src',
            build: 'assets/build'
        },
        exitCode = 0,
        watch = false,
        eHandler = function(e) {

            // notify
            // console.log(e);
            $.notify.onError('Error: <%= error.message %>')(e);

            // fail the build if it isn't a watch
            if (!watch) {
                exitCode = 1;
                process.emit('exit');
            }

            // else emit an end if it's a watch - ideally we could prevent
            // dependant tasks from running ,but doesn't seem to work right now
            else {
                this.emit('end');
            }

        };

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ jsonlint
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('jsonlint', function(notest) {

        // don't run the tests if the --notest flag is supplied
        // used for deploys when we don't alweays install all the dev deps
        if (notest) return true;

        return gulp.src([
            'package.json',
            'bower.json',
            '.bowerrc',
            '.jshintrc',
        ])
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.jsonlint())
        .pipe($.jsonlint.failOnError())
        .pipe($.jsonlint.reporter(''))
        .pipe($.notify({
            onLast: true,
            message: 'jsonlint complete'
        }));
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ jshint
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('jshint', function(notest) {

        // don't run the tests if the --notest flag is supplied
        // used for deploys when we don't always install all the dev deps
        if (notest) return true;

        return gulp.src([
            'gulpfile.js',
            _.src + '/js/**/*.js',
            '!' + _.vendor + '/**/*.js',
            'test/spec/{,*/}*.js'
        ])
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.jshint())
        .pipe($.jshint.reporter('default'))
        .pipe($.jshint.reporter('fail'))
        .pipe($.notify({
            onLast: true,
            message: 'jshint complete'
        }));
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ scss-lint
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('scss-lint', function(notest) {

        // don't run the tests if the --notest flag is supplied
        // used for deploys when we don't always install all the dev deps
        if (notest) return true;

        // the task
        return gulp.src(_.src + '/scss/**/*')
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.scssLint({
            bundleExec: true,
            maxBuffer: 1024 * 1024
        }))
        .pipe($.scssLint.failReporter('E'))
        .pipe($.notify({
            onLast: true,
            message: 'scss-lint complete'
        }));
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ php-lint
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('phplint', function(notest) {

        // don't run the tests if the --notest flag is supplied
        // used for deploys when we don't always install all the dev deps
        if (notest) return true;

        return gulp.src(_.project + '/**/*.php')
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.phplint('', {}))
        .pipe($.phplint.reporter('fail'))
        .pipe($.notify({
            onLast: true,
            message: 'phplint complete'
        }));
    });

    gulp.task('phpcs-conf', function(notest) {

        // don't run the tests if the --notest flag is supplied
        // used for deploys when we don't always install all the dev deps
        if (notest) return true;

        return $.shelljs.exec('vendor/squizlabs/php_codesniffer/scripts/phpcs --config-set ignore_warnings_on_exit 1');
    });

    gulp.task('phpcs', ['phpcs-conf'], function(notest) {

        // don't run the tests if the --notest flag is supplied
        // used for deploys when we don't always install all the dev deps
        if (notest) return true;

        return gulp.src(_.project + '/**/*.php')
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.phpcs({
            bin: 'vendor/squizlabs/php_codesniffer/scripts/phpcs',
            showSniffCode: true,
        }))
        .pipe($.phpcs.reporter('log'))
        .pipe($.phpcs.reporter('fail'))
        .pipe($.notify({
            onLast: true,
            message: 'phpcs complete'
        }));
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ js
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('js-lib', function() {
        return gulp.src([
            _.vendor + 'jquery-tokenize/jquery.tokenize.js',
            _.vendor + '/respond/dest/respond.min.js',
            _.vendor + '/picturefill/src/picturefill.js'
        ])
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.concat('lib.js'))
        .pipe($.gulp.dest(_.build + '/js'))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'js-lib complete'
        }));
    });

    gulp.task('js', function() {
        return gulp.src([
            _.src + '/js/**/*.js'
        ])
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.gulp.dest(_.build + '/js'))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'js complete'
        }));
    });


    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ styles
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('styles', ['scss-lint'], function() {
        return $.rubySass(_.src + '/scss/', {
            sourcemap: true,
            bundleExec: true
        })
        .pipe($.plumber({errorHandler: eHandler}))
        .on('error', $.util.log)
        //.pipe($.sourcemaps.write())
        .pipe(gulp.dest(_.build + '/css'))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'styles complete'
        }));
    });

    gulp.task('styles-build', ['scss-lint'], function() {
        return $.rubySass(_.src + '/scss/', {
            sourcemap: false,
            style: 'compressed',
            bundleExec: true
        })
        .pipe($.plumber({errorHandler: eHandler}))
        .on('error', $.util.log)
        .pipe($.csso())
        .pipe(gulp.dest(_.build + '/css'))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'styles-build complete'
        }));
    });

    gulp.task('styles-blessed', ['styles'], function() {
        return gulp.src(_.build + '/css/main.css')
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.bless())
        .pipe(gulp.dest(_.build + '/css/blessed'))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'styles-blessed complete'
        }));
    });

    gulp.task('styles-blessed-build', ['styles-build'], function() {
        return gulp.src(_.build + '/css/main.css')
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe($.bless())
        .pipe(gulp.dest(_.build + '/css/blessed'))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'styles-blessed-build complete'
        }));
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ img
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('img', function() {

        // load optimiser plugins
        var pngquant = require('imagemin-pngquant'),
            jpegoptim = require('imagemin-jpegoptim');

        return gulp.src([
            _.src + '/img/**/*.{png,jpg,jpeg,gif,ico}'
        ])
        .pipe($.plumber({errorHandler: eHandler}))
        .pipe(
            $.imageOptimization({
                optimizationLevel: 4,
                progressive: true,
                interlaced: true,
                use: [
                    pngquant(),
                    jpegoptim({
                        progressive: true,
                        max: 80
                    }),
                ]
            })
        )
        .pipe(gulp.dest(_.build + '/img'))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'img complete'
        }));
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ copy
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('copy', function() {
        return gulp.src([
            _.src + '/font/**/*'
        ])
        .pipe($.plumber())
        .pipe(gulp.dest(_.build + '/font'))
        .pipe($.size())
        .pipe($.notify({
            onLast: true,
            message: 'copy complete'
        }));
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ watch
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
    gulp.task('watch', function() {

        // don't kill gulp if it's a watch
        watch = true;

        // Watch style files
        $.watch([_.src + '/scss/**/*.scss', _.vendor + '/**/*.scss'], function() {
            gulp.start('styles-blessed');
            gulp.start('scss-lint');
        });

        // Watch script files
        $.watch([_.src + '/js/**/*', _.vendor + '/**/*.js'], function() {
            gulp.start('js-predom');
            gulp.start('jshint');
        });

        // Watch image files
        $.watch([_.src + '/img/*'], function() {
            gulp.start('img');
            gulp.start('svg');
        });

        // Watch image files
        $.watch([_.src + '/font/*'], function() {
            gulp.start('copy');
        });

        // not 100% sure of a nice way to lint php for this currently
        // Watch php files
        // $.watch([_.project + '/**/*.php'], function() {
        //     gulp.start('php-qa');
        // });

    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ clean
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('clean', function (cb) {
      $.del([
        _.build + '/img',
        _.build + '/js',
        _.build + '/css',
        _.build + '/font'
      ], cb);
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ alias
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('php-qa', ['phpcs', 'phplint']);
    // not 100% sure of a nice way to lint php for this currently
    // gulp.task('test', ['jsonlint', 'jshint', 'php-qa', 'scss-lint']);
    gulp.task('test', ['jsonlint', 'jshint', 'scss-lint']);
    gulp.task('build', ['test', 'img', 'js-lib', 'js', 'styles-blessed-build', 'copy']);

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ default
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    gulp.task('default', ['clean'], function() {
        gulp.start('build');
    });

    //|**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //| ✓ exit on error
    //'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

    process.on('exit', function () {
        process.nextTick(function () {
            process.exit(exitCode);
        });
    });

}(require('gulp-param')(require('gulp'), process.argv), require('gulp-load-plugins')));
