var doc = document.documentElement;
doc.setAttribute('data-useragent', navigator.userAgent);

var slowTimeline = new TimelineMax({repeat: -1});
var mediumTimeline = new TimelineMax({repeat: -1});
var fastTimeline = new TimelineMax({repeat: -1});

slowTimeline
  .to('.CW.small', 1, {rotation: 360, transformOrigin: "50% 50%", ease: Linear.easeNone}, 0)
  .to('.CCW.small', 1, {rotation: -360, transformOrigin: "50% 50%", ease: Linear.easeNone}, 0)

mediumTimeline
  .to('.CW.medium', 2, {rotation: 360, transformOrigin: "50% 50%", ease: Linear.easeNone}, 0)
  .to('.CCW.medium', 2, {rotation: -360, transformOrigin: "50% 50%", ease: Linear.easeNone}, 0)

fastTimeline
  .to('.CW.large', 4, {rotation: 360, transformOrigin: "50% 50%", ease: Linear.easeNone}, 0)
  .to('.CCW.large', 4, {rotation: -360, transformOrigin: "50% 50%", ease: Linear.easeNone}, 0)
  .to('.Crank', 4, {transformOrigin: "200px 50%", ease: Linear.easeNone}, 0)