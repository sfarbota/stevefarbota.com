var cache = require('gulp-cache'),
  cleanCss = require('gulp-clean-css'),
  debug = require('gulp-debug'),
  del = require('del'),
  flatten = require('gulp-flatten'),
  gulp = require('gulp'),
  gulpif = require('gulp-if'),
  htmlSrc = require('gulp-html-src'),
  imagemin = require('gulp-imagemin'),
  pug = require('gulp-pug'),
  rename = require('gulp-rename'),
  replace = require('gulp-replace'),
  runSequence = require('run-sequence'),
  sass = require('gulp-sass'),
  sitemap = require('gulp-sitemap'),
  uglify = require('gulp-uglify'),
  useref = require('gulp-useref');

gulp.task('build-html', function() {
  return gulp.src('src/*.pug')
    .pipe(pug({
      pretty: true
    }))
    .pipe(gulp.dest('src'))
});

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
      '!src/**/*.js',
      '!src/**/*.pug',
      '!src/robots.txt'],
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

gulp.task('copy-robots-txt-develop', function() {
  return gulp.src('src/robots.txt')
    .pipe(replace('Allow', 'Disallow'))
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-robots-txt-production', function() {
  return gulp.src('src/robots.txt')
    .pipe(gulp.dest('dist'));
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
    'build-html',
    'sass',
    ['copy-with-references', 'copy-static-files', 'images', 'fonts', 'copy-robots-txt-develop'],
    'sitemap',
    callback
  );
});

gulp.task('build-production', function (callback) {
  runSequence('clean:dist',
    'build-html',
    'sass',
    ['useref', 'copy-static-files', 'images', 'fonts', 'copy-robots-txt-production'],
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

gulp.task('deploy-develop:dependencies', function (callback) {
  return gulp.src([
      'node_modules/express/**/*',
      'node_modules/accepts/**/*',
      'node_modules/mime-types/**/*',
      'node_modules/mime-db/**/*',
      'node_modules/negotiator/**/*',
      'node_modules/array-flatten/**/*',
      'node_modules/content-disposition/**/*',
      'node_modules/content-type/**/*',
      'node_modules/cookie/**/*',
      'node_modules/cookie-signature/**/*',
      'node_modules/debug/**/*',
      'node_modules/ms/**/*',
      'node_modules/depd/**/*',
      'node_modules/escape-html/**/*',
      'node_modules/etag/**/*',
      'node_modules/finalhandler/**/*',
      'node_modules/unpipe/**/*',
      'node_modules/fresh/**/*',
      'node_modules/merge-descriptors/**/*',
      'node_modules/methods/**/*',
      'node_modules/on-finished/**/*',
      'node_modules/ee-first/**/*',
      'node_modules/parseurl/**/*',
      'node_modules/path-to-regexp/**/*',
      'node_modules/proxy-addr/**/*',
      'node_modules/forwarded/**/*',
      'node_modules/ipaddr.js/**/*',
      'node_modules/qs/**/*',
      'node_modules/range-parser/**/*',
      'node_modules/send/**/*',
      'node_modules/destroy/**/*',
      'node_modules/http-errors/**/*',
      'node_modules/inherits/**/*',
      'node_modules/mime/**/*',
      'node_modules/statuses/**/*',
      'node_modules/serve-static/**/*',
      'node_modules/send/**/*',
      'node_modules/type-is/**/*',
      'node_modules/media-typer/**/*',
      'node_modules/utils-merge/**/*',
      'node_modules/vary/**/*'],
      { base: 'node_modules' })
    .pipe(gulp.dest('/var/www/html/develop.stevefarbota.com/node_modules'));
});

gulp.task('deploy-develop:back-end', function (callback) {
  runSequence('clean:deploy-develop-back-end-dest',
    ['deploy-develop:stevefarbota.com.js', 'deploy-develop:root', 'deploy-develop:dependencies'],
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

gulp.task('deploy-production:dependencies', function (callback) {
  return gulp.src([
      'node_modules/express/**/*',
      'node_modules/accepts/**/*',
      'node_modules/mime-types/**/*',
      'node_modules/mime-db/**/*',
      'node_modules/negotiator/**/*',
      'node_modules/array-flatten/**/*',
      'node_modules/content-disposition/**/*',
      'node_modules/content-type/**/*',
      'node_modules/cookie/**/*',
      'node_modules/cookie-signature/**/*',
      'node_modules/debug/**/*',
      'node_modules/ms/**/*',
      'node_modules/depd/**/*',
      'node_modules/escape-html/**/*',
      'node_modules/etag/**/*',
      'node_modules/finalhandler/**/*',
      'node_modules/unpipe/**/*',
      'node_modules/fresh/**/*',
      'node_modules/merge-descriptors/**/*',
      'node_modules/methods/**/*',
      'node_modules/on-finished/**/*',
      'node_modules/ee-first/**/*',
      'node_modules/parseurl/**/*',
      'node_modules/path-to-regexp/**/*',
      'node_modules/proxy-addr/**/*',
      'node_modules/forwarded/**/*',
      'node_modules/ipaddr.js/**/*',
      'node_modules/qs/**/*',
      'node_modules/range-parser/**/*',
      'node_modules/send/**/*',
      'node_modules/destroy/**/*',
      'node_modules/http-errors/**/*',
      'node_modules/inherits/**/*',
      'node_modules/mime/**/*',
      'node_modules/statuses/**/*',
      'node_modules/serve-static/**/*',
      'node_modules/send/**/*',
      'node_modules/type-is/**/*',
      'node_modules/media-typer/**/*',
      'node_modules/utils-merge/**/*',
      'node_modules/vary/**/*'],
      { base: 'node_modules' })
    .pipe(gulp.dest('/var/www/html/stevefarbota.com/node_modules'));
});

gulp.task('deploy-production:back-end', function (callback) {
  runSequence('clean:deploy-production-back-end-dest',
    ['deploy-production:root', 'deploy-production:dependencies'],
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
