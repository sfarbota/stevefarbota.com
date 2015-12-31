var gulp = require('gulp'),
  sass = require('gulp-sass'),
  useref = require('gulp-useref'),
  gulpif = require('gulp-if'),
  uglify = require('gulp-uglify'),
  minifyCss = require('gulp-minify-css'),
  imagemin = require('gulp-imagemin'),
  cache = require('gulp-cache'),
  del = require('del'),
  runSequence = require('run-sequence');

gulp.task('hello', function() {
  console.log('Hello, World!')
});

gulp.task('sass', function() {
  return gulp.src('src/scss/**/*.scss')
    .pipe(sass()) // Converts Sass to CSS with gulp-sass
    .pipe(gulp.dest('src/css'))
});

gulp.task('watch', ['sass'], function () {
  gulp.watch('src/scss/**/*.scss', ['sass'])
});

gulp.task('useref', function() {
  return gulp.src('src/*.html')
    .pipe(useref())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', minifyCss()))
    .pipe(gulp.dest('dist'))
});

gulp.task('images', function(){
  return gulp.src('src/images/**/*.+(png|jpg|jpeg|gif|svg|bmp|ico)')
  // Caching images that ran through imagemin
  .pipe(cache(imagemin({
      interlaced: true
    })))
  .pipe(gulp.dest('dist/images'))
});

gulp.task('fonts', function() {
  return gulp.src('src/fonts/**/*')
  .pipe(gulp.dest('dist/fonts'))
});

gulp.task('clean', function(callback) {
  del('dist');
  return cache.clearAll(callback);
});

gulp.task('clean:dist', function(){
  return del(['dist/**/*', '!dist/images', '!dist/images/**/*'])
});

gulp.task('clean:deploy-dest', function(){
  return del('/var/www/html/stevefarbota.com/**/*', {force: true})
});

gulp.task('build', function (callback) {
  runSequence('clean:dist',
    ['sass', 'useref', 'images', 'fonts'],
    callback
  )
});

gulp.task('deploy:root', function (callback) {
  return gulp.src([
    '**/*',
    '!node_modules',
    '!node_modules/**/*',
    '!dist',
    '!dist/**/*',
    '!src',
    '!src/**/*',
    '!bower_components',
    '!bower_components/**/*',
    '!bower.json',
    '!package.json',
    '!gulpfile.js'])
  .pipe(gulp.dest('/var/www/html/stevefarbota.com'))
});

gulp.task('deploy:dist', function (callback) {
  return gulp.src('dist/**/*')
  .pipe(gulp.dest('/var/www/html/stevefarbota.com/httpdocs'))
});

gulp.task('deploy:express', function (callback) {
  return gulp.src('node_modules/express/**/*')
  .pipe(gulp.dest('/var/www/html/stevefarbota.com/node_modules/express'))
});

gulp.task('deploy', function (callback) {
  runSequence('clean:deploy-dest',
    ['deploy:root', 'deploy:dist', 'deploy:express'],
    callback
  )
});

gulp.task('default', function (callback) {
  runSequence(['sass', 'watch'],
    callback
  )
});