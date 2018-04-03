
// Ref: https://www.alsacreations.com/tuto/lire/1686-introduction-a-gulp.html

// Required
var gulp = require('gulp');

// Include plugins
var plugins = require('gulp-load-plugins')(); // tous les plugins de package.json

var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');



/* Alternate way (see:  https://stackoverflow.com/questions/21961142/gulp-concat-scripts-in-order)
 * 
 * var sources = [ './src/canvas/Main.js',
 *               './src/canvas/*.js'];
 */

var destination = './dist'; // destination

gulp.task('canvas', function() {
    // Path variables
    var sources = [ './src/canvas/Main.js',
                    './src/canvas/Arrows.js',
                    './src/canvas/Sliders.js',
                    './src/canvas/Meters.js',
                    './src/canvas/Switches.js',
                    './src/canvas/Images.js',
                    './src/canvas/Polyline.js',
    ];
    var dest_name = "modsimlib.js"
    var dest_name_min = "modsimlib.min.js"
    gulp.src(sources)
    .pipe(concat(dest_name))
    .pipe(gulp.dest(destination))
    .pipe(rename(dest_name_min))
    .pipe(uglify())
    .pipe(gulp.dest(destination));
});

gulp.task('plot', function() {
    // Path variables
    var sources = [ './src/plot/MGraph_main.js',
    ];    
    var dest_name = "mgraph.js"
    var dest_name_min = "mgraph.min.js"
    gulp.src(sources)
    .pipe(concat(dest_name))
    .pipe(gulp.dest(destination))
    .pipe(rename(dest_name_min))
    .pipe(uglify())
    .pipe(gulp.dest(destination));
});

gulp.task('simulator', function() {
    // Path variables
    var sources = [ './src/simulator/simulator.js',
    ];    
    var dest_name = "simulator.js"
    var dest_name_min = "simulator.min.js"
    gulp.src(sources)
    .pipe(concat(dest_name))
    .pipe(gulp.dest(destination))
    .pipe(rename(dest_name_min))
    .pipe(uglify())
    .pipe(gulp.dest(destination));
});

// Tâche par défaut
gulp.task('default', ['canvas', 'plot', 'simulator']);

