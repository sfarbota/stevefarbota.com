var stackOverflowUserId = 170309;
var tagCount = 6;
var minContainerR = 100;
var minFractionOfContainerR = 0.15;
var maxFractionOfContainerR = 0.35;
var speed = 0.8;

var container = document.getElementById('current-areas-of-focus-container');
var containerRect = container.getBoundingClientRect();
var containerParentRect = container.parentElement.getBoundingClientRect();
var mainFooterRect = $('#main-footer')[0].getBoundingClientRect();
var containerHeight = mainFooterRect.top - containerParentRect.bottom;
var containerWidth = containerRect.right - containerRect.left;
mainContainerR = containerWidth < minContainerR ? containerWidth : minContainerR;
var containerR = (containerHeight < containerWidth ? containerHeight : containerWidth) / 2;
containerR = containerR < minContainerR ? minContainerR : containerR;

var textSize = containerR / 20;
var textLineSpacing = containerR / 20;

var svgNamespace = 'http://www.w3.org/2000/svg';
var svg = document.createElementNS(svgNamespace, 'svg');
svg.id = 'svg-wrapper';
$('#current-areas-of-focus-container').append(svg);

var balls = [];

getTags();

function getTags() {
  $.getJSON('https://api.stackexchange.com/2.2/users/' + stackOverflowUserId + '/tags?sort=popular&order=desc&pagesize=' + tagCount+ '&page=1&site=stackoverflow', function(data) {
    var tags = [];
    var tagDescriptions = [];
    var minTagUsageCount = Number.MAX_VALUE;
    var maxTagUsageCount = Number.MIN_VALUE;
    
    $.each(data.items, function(key, val) {
      tags.push(val.name);
      
      if (val.count < minTagUsageCount) {
        minTagUsageCount = val.count;
      }
      
      if (val.count > maxTagUsageCount) {
        maxTagUsageCount = val.count;
      }
    });
    
    $.getJSON('https://api.stackexchange.com/2.2/tags/' + tags.join(';') + '/wikis?site=stackoverflow', function(tagDetailData) {
      $.each(tagDetailData.items, function(key, val) {
        tagDescriptions[val.tag_name] = val.excerpt;
      });
    });
    
    $.each(data.items, function(key, val) {
      var imageSource = '/images/' + val.name + '.png';
      
      $.get(imageSource).done(function() {
        var image = new Image(100, 100);
        image.src = imageSource;
        
        image.onload = function() {
          var colors = (new ColorThief()).getPalette(image, 5, 10);
          var dominantColor = null;
          var defaultColor = [0, 0, 0];
          var minRGBDifference = 20;
          var i = 0;
          while (dominantColor === null && i < colors.length) {
            var curColor = colors[i];
            if (! (Math.abs(curColor[0] - curColor[1]) < minRGBDifference
                && Math.abs(curColor[0] - curColor[2]) < minRGBDifference
                && Math.abs(curColor[1] - curColor[2]) < minRGBDifference)) {
              dominantColor = curColor;
            }
            i++;
          }
          if (dominantColor === null) {
            dominantColor = defaultColor;
          }
          var dominantColorRGB = 'rgb(' + dominantColor.join(',') + ')';
          pushBall(minTagUsageCount, maxTagUsageCount, val.count, dominantColorRGB, imageSource, val.name, tagDescriptions[val.name]);
        };
      }).fail(function() {
          pushBall(minTagUsageCount, maxTagUsageCount, val.count, randomColor({hue: 'random', luminosity: 'bright', count: 1}), null, val.name, tagDescriptions[val.name]);
      });
      
      if (key >= tagCount - 1) {
        return false;
      }
    });

    initDrawing();
    
    //draw();
    setInterval(draw, 10);
  });
}

function pushBall(minTagUsageCount, maxTagUsageCount, curTagUsageCount, color, imageSource, title, description) {
  var minBallR = minFractionOfContainerR * containerR;
  var maxBallR = maxFractionOfContainerR * containerR;
  var ballRRange = maxBallR - minBallR;
  var tagUsageCountRange = maxTagUsageCount - minTagUsageCount;
  var ballR = (ballRRange * (curTagUsageCount - minTagUsageCount) / tagUsageCountRange) + minBallR;
  balls.push(getBall(containerR * (Math.random() + 0.5), containerR * (Math.random() + 0.5), (Math.random() < 0.5 ? -1 : 1) * speed, (Math.random() < 0.5 ? -1 : 1) * speed, ballR, color, imageSource, title, description));
}

function getBall(xVal, yVal, dxVal, dyVal, rVal, colorVal, imageVal, titleVal, descriptionVal) {
  var ball = {
    x: xVal,
    y: yVal,
    dx: dxVal,
    dy: dyVal,
    r: rVal,
    color: colorVal,
    image: imageVal,
    imageObject: imageVal,
    title: titleVal,
    description: descriptionVal
  };

  return ball;
}

function initDrawing() {
  svg.style.width = containerR * 2 + 'px';
  svg.style.height = containerR * 2 + 'px';
  svg.style.borderRadius = containerR + 'px';
  svg.style.background = '#eee';
	svg.style.font = textSize + 'px Arial';
}

function draw() {
  for (var i = 0; i < balls.length; i++) {
    var curBall = balls[i];

    if (! $('#ball-' + i).filter(function() { return $(this).is(':hover'); }).length
    		&& ! $('#ball-' + i + '-image').filter(function() { return $(this).is(':hover'); }).length
    		&& ! $('#ball-' + i + '-text').filter(function() { return $(this).is(':hover'); }).length) {
      $('#ball-' + i + '-text').remove();
      $('#ball-' + i + '-image').remove();
      $('#ball-' + i).remove();
      var circle = document.createElementNS(svgNamespace, 'circle');
      circle.id = 'ball-' + i;
      circle.setAttributeNS(null, 'cx', curBall.x);
      circle.setAttributeNS(null, 'cy', curBall.y);
      circle.setAttributeNS(null, 'r',  curBall.r);
      circle.setAttributeNS(null, 'fill', curBall.color);
      circle.style.cursor = 'pointer';

      if (curBall.image !== null) {
        var curBallImage = document.createElementNS(svgNamespace, 'image');
        curBallImage.id = 'ball-' + i + '-image';
        curBallImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', curBall.image);
        curBallImage.setAttributeNS(null,'height', curBall.r * 1.4);
        curBallImage.setAttributeNS(null,'width', curBall.r * 1.4);
        curBallImage.setAttributeNS(null,'x', curBall.x - (curBall.r * 0.7));
        curBallImage.setAttributeNS(null,'y', curBall.y - (curBall.r * 0.7));
        curBallImage.setAttributeNS(null, 'visibility', 'visible');
        curBallImage.style.cursor = 'pointer';
        $('#svg-wrapper').append(circle);
        $('#svg-wrapper').append(curBallImage);
      } else {
  			var curBallText = document.createElementNS(svgNamespace, 'text');
        curBallText.id = 'ball-' + i + '-text';
        var titleWords = curBall.title.toUpperCase().split('-');
        //var baseX = curBall.x;
        //var baseY = curBall.y + (containerR / 40);
        curBallText.setAttributeNS(null,'x', curBall.x);
        curBallText.setAttributeNS(null,'y', curBall.y);
        //curBallText.textContent = curBall.title.toUpperCase().replace(/-/g, ' ');
        curBallText.setAttributeNS(null, 'fill', '#000');
        curBallText.style.cursor = 'pointer';
        $('#svg-wrapper').append(circle);
        $('#svg-wrapper').append(curBallText);
        for (var j = 0; j < titleWords.length; j++) {
          var curTitleWordTextSpan = document.createElementNS(svgNamespace, 'tspan');
          curTitleWordTextSpan.setAttributeNS(null,'dy', textLineSpacing + 'px');
          curTitleWordTextSpan.textContent = titleWords[j];
          $('#ball-' + i + '-text').append(curTitleWordTextSpan);
          curTitleWordTextSpan.setAttributeNS(null,'x', curBall.x - (curTitleWordTextSpan.getComputedTextLength() / 2));
        }
        //if (curBallText.getComputedTextLength() / 2 > curBall.r) {
        //  curBallText.textContent = curBallText.textContent.replace(/ /g, '&lt;br/&gt;')
        //}
        curBallText.setAttributeNS(null,'x', curBall.x - (curBallText.getComputedTextLength() / 2));
        curBallText.setAttributeNS(null,'y', curBall.y - (textSize + ((titleWords.length - 1) * textLineSpacing)) / 2);
      }
      
      curBall.x += curBall.dx;
      curBall.y += curBall.dy;
      var dx = curBall.x - containerR;
      var dy = curBall.y - containerR;
      var distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

      if (distanceFromCenter >= containerR - curBall.r) {
        var normalMagnitude = distanceFromCenter;
        var normalX = dx / normalMagnitude;
        var normalY = dy / normalMagnitude;
        var tangentX = -normalY;
        var tangentY = normalX;
        var normalSpeed = -(normalX * curBall.dx + normalY * curBall.dy);
        var tangentSpeed = tangentX * curBall.dx + tangentY * curBall.dy;
        curBall.dx = normalSpeed * normalX + tangentSpeed * tangentX;
        curBall.dy = normalSpeed * normalY + tangentSpeed * tangentY;
      }
    }
  }
  
  //requestAnimationFrame(function() {
  //  draw();
  //});
}