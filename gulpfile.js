var gulp = require('gulp'),
  sass = require('gulp-sass'),
  useref = require('gulp-useref'),
  htmlSrc = require('gulp-html-src'),
  flatten = require('gulp-flatten'),
  gulpif = require('gulp-if'),
  rename = require('gulp-rename'),
  replace = require('gulp-replace'),
  uglify = require('gulp-uglify'),
  cleanCss = require('gulp-clean-css'),
  imagemin = require('gulp-imagemin'),
  cache = require('gulp-cache'),
  del = require('del'),
  runSequence = require('run-sequence'),
  debug = require('gulp-debug'),
  sitemap = require('gulp-sitemap');

gulp.task('sass', function() {
  return gulp.src('src/scss/app.scss')
    .pipe(sass({includePaths: ['bower_components/foundation-sites/scss']}))
    .pipe(gulp.dest('src/css'));
});

gulp.task('watch', ['sass'], function () {
  gulp.watch('src/scss/**/*.scss', ['sass']);
});

gulp.task('useref', function() {
  return gulp.src('src/**/*.html')
    .pipe(useref())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', cleanCss()))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-css-references', function() {
	return gulp.src('src/**/*.html')
		.pipe(htmlSrc({ presets: 'css' }))
		.pipe(flatten())
		.pipe(gulp.dest('dist/css'));
});

gulp.task('copy-js-references', function() {
	return gulp.src('src/**/*.html')
		.pipe(htmlSrc({ presets: 'script'}))
		.pipe(flatten())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('copy-modified-html-files', function() {
  return gulp.src('src/**/*.html')
    .pipe(replace(/..\/bower_components\/.*\/(.*\.js)/g, 'js/$1'))
    .pipe(replace(/..\/bower_components\/.*\/(.*\.css)/g, 'css/$1'))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-static-files', function (callback) {
  return gulp.src([
    'src/**/*',
    '!src/**/*.html',
    '!src/**/*.css',
    '!src/**/*.scss',
    '!src/**/*.sass',
    '!src/**/*.js',],
    { nodir: true })
  .pipe(gulp.dest('dist'));
});

gulp.task('copy-with-references', function(callback) {
  runSequence(
    ['copy-css-references', 'copy-js-references', 'copy-modified-html-files'],
    callback
  );
});

gulp.task('images', function(){
  return gulp.src('src/images/**/*.+(png|jpg|jpeg|gif|svg|bmp|ico)')
  .pipe(cache(imagemin({
      interlaced: true
    })))
  .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', function() {
  return gulp.src('src/fonts/**/*')
  .pipe(gulp.dest('dist/fonts'));
});
 
gulp.task('sitemap', function () {
    gulp.src('dist/**/*.html')
        .pipe(sitemap({
            siteUrl: 'http://www.stevefarbota.com'
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function(callback) {
  del('dist');
  return cache.clearAll(callback);
});

gulp.task('clean:dist', function() {
  return del(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

gulp.task('clean:deploy-develop-back-end-dest', function() {
  return del(['/var/www/html/develop.stevefarbota.com/**/*', '!/var/www/html/develop.stevefarbota.com/httpdocs'], {force: true});
});

gulp.task('clean:deploy-develop-front-end-dest', function() {
  return del('/var/www/html/develop.stevefarbota.com/httpdocs/**/*', {force: true});
});

gulp.task('clean:deploy-production-back-end-dest', function() {
  return del(['/var/www/html/stevefarbota.com/**/*', '!/var/www/html/stevefarbota.com/httpdocs'], {force: true});
});

gulp.task('clean:deploy-production-front-end-dest', function() {
  return del('/var/www/html/stevefarbota.com/httpdocs/**/*', {force: true});
});

gulp.task('build-develop', function (callback) {
  runSequence('clean:dist',
    'sass',
    ['copy-with-references', 'copy-static-files', 'images', 'fonts'],
    'sitemap',
    callback
  );
});

gulp.task('build-production', function (callback) {
  runSequence('clean:dist',
    'sass',
    ['useref', 'copy-static-files', 'images', 'fonts'],
    'sitemap',
    callback
  );
});

gulp.task('deploy-develop:dist', function (callback) {
  return gulp.src('dist/**/*')
  .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com/httpdocs'));
});

gulp.task('deploy-develop:front-end', function (callback) {
  runSequence('build-develop',
    'clean:deploy-develop-front-end-dest',
    'deploy-develop:dist',
    callback
  );
});

gulp.task('deploy-develop:stevefarbota.com.js', function (callback) {
  return gulp.src('stevefarbota.com.js')
  .pipe(replace('8080', '8181'))
  .pipe(replace('stevefarbota.com', 'develop.stevefarbota.com'))
  .pipe(rename({
    prefix: "develop.",
  }))
  .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com'));
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
  .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com'));
});

gulp.task('deploy-develop:express', function (callback) {
  return gulp.src('node_modules/express/**/*')
  .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com/node_modules/express'));
});

gulp.task('deploy-develop:back-end', function (callback) {
  runSequence('clean:deploy-develop-back-end-dest',
    ['deploy-develop:stevefarbota.com.js', 'deploy-develop:root', 'deploy-develop:express'],
    callback
  );
});

gulp.task('deploy-develop', function (callback) {
  runSequence(['deploy-develop:back-end', 'deploy-develop:front-end'],
    callback
  );
});

gulp.task('deploy-production:dist', function (callback) {
  return gulp.src('dist/**/*')
  .pipe(gulp.dest('/var/www/html/stevefarbota.com/httpdocs'));
});

gulp.task('deploy-production:front-end', function (callback) {
  runSequence('build-production',
    'clean:deploy-production-front-end-dest',
    'deploy-production:dist',
    callback
  );
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
  .pipe(gulp.dest('/var/www/html/stevefarbota.com'));
});

gulp.task('deploy-production:express', function (callback) {
  return gulp.src('node_modules/express/**/*')
  .pipe(gulp.dest('/var/www/html/stevefarbota.com/node_modules/express'));
});

gulp.task('deploy-production:back-end', function (callback) {
  runSequence('clean:deploy-production-back-end-dest',
    ['deploy-production:root', 'deploy-production:express'],
    callback
  );
});

gulp.task('deploy-production', function (callback) {
  runSequence(['deploy-production:back-end', 'deploy-production:front-end'],
    callback
  );
});

gulp.task('default', function (callback) {
  runSequence(['sass', 'watch'],
    callback
  );
});