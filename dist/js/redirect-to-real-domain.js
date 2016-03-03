function redirectToRealDomain() {
  var realDomain = 'stevefarbota.com';
  if (document.domain !== realDomain
      && (document.domain.length < realDomain.length
      || document.domain.substr(-(realDomain.length + 1)) !== ('.' + realDomain))) {
    window.location = 'http://' + realDomain + window.location.pathname;
  }
}

$(document).ready(function() {
  redirectToRealDomain();
});