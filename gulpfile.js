var gulp = require('gulp'),
  sass = require('gulp-sass'),
  useref = require('gulp-useref'),
  htmlSrc = require('gulp-html-src'),
  flatten = require('gulp-flatten'),
  gulpif = require('gulp-if'),
  rename = require('gulp-rename'),
  replace = require('gulp-replace'),
  uglify = require('gulp-uglify'),
  minifyCss = require('gulp-minify-css'),
  imagemin = require('gulp-imagemin'),
  cache = require('gulp-cache'),
  del = require('del'),
  runSequence = require('run-sequence'),
  debug = require('gulp-debug');

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

gulp.task('copy-css-references', function() {
	return gulp.src('./src/*.html')
		.pipe(htmlSrc({ presets: 'css' }))
		.pipe(flatten())
		.pipe(gulp.dest('dist/css'));
});

gulp.task('copy-js-references', function() {
	return gulp.src('src/*.html')
		.pipe(htmlSrc({ presets: 'script'}))
		.pipe(flatten())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('copy-modified-html-files', function() {
  return gulp.src('src/*.html')
    .pipe(replace(/..\/bower_components\/.*\/(.*\.js)/g, 'js/$1'))
    .pipe(replace(/..\/bower_components\/.*\/(.*\.css)/g, 'css/$1'))
    .pipe(gulp.dest('dist'))
});

gulp.task('copy-with-references', function(callback) {
  runSequence(
    ['copy-css-references', 'copy-js-references', 'copy-modified-html-files'],
    callback
  )
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

gulp.task('clean:deploy-develop-dest', function(){
  return del('/var/www/html/develop.stevefarbota.com/**/*', {force: true})
});

gulp.task('clean:deploy-production-dest', function(){
  return del('/var/www/html/stevefarbota.com/**/*', {force: true})
});

gulp.task('build-develop', function (callback) {
  runSequence('clean:dist',
    ['sass', 'copy-with-references', 'images', 'fonts'],
    callback
  )
});

gulp.task('build-production', function (callback) {
  runSequence('clean:dist',
    ['sass', 'useref', 'images', 'fonts'],
    callback
  )
});

gulp.task('deploy-develop:root', function (callback) {
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
    '!gulpfile.js',
    '!LICENSE',
    '!README.md',
    '!stevefarbota.com.js'])
  .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com'))
});

gulp.task('deploy-develop:stevefarbota.com.js', function (callback) {
  return gulp.src('stevefarbota.com.js')
  .pipe(replace('8080', '8181'))
  .pipe(replace('stevefarbota.com', 'develop.stevefarbota.com'))
  .pipe(rename({
    prefix: "develop.",
  }))
  .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com'))
});

gulp.task('deploy-develop:dist', function (callback) {
  return gulp.src('dist/**/*')
  .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com/httpdocs'))
});

gulp.task('deploy-develop:express', function (callback) {
  return gulp.src('node_modules/express/**/*')
  .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com/node_modules/express'))
});

gulp.task('deploy-develop', function (callback) {
  runSequence('build-develop',
    'clean:deploy-develop-dest',
    ['deploy-develop:root', 'deploy-develop:stevefarbota.com.js', 'deploy-develop:dist', 'deploy-develop:express'],
    callback
  )
});

gulp.task('deploy-production:root', function (callback) {
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
    '!gulpfile.js',
    '!LICENSE',
    '!README.md'])
  .pipe(gulp.dest('/var/www/html/stevefarbota.com'))
});

gulp.task('deploy-production:dist', function (callback) {
  return gulp.src('dist/**/*')
  .pipe(gulp.dest('/var/www/html/stevefarbota.com/httpdocs'))
});

gulp.task('deploy-production:express', function (callback) {
  return gulp.src('node_modules/express/**/*')
  .pipe(gulp.dest('/var/www/html/stevefarbota.com/node_modules/express'))
});

gulp.task('deploy-production', function (callback) {
  runSequence('build-production',
    'clean:deploy-production-dest',
    ['deploy-production:root', 'deploy-production:dist', 'deploy-production:express'],
    callback
  )
});

gulp.task('default', function (callback) {
  runSequence(['sass', 'watch'],
    callback
  )
});