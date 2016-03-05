var stackOverflowUserId = 170309;
var stackOverflowTagCount = 6;

var jsFiddleUserId = 'sfarbota';
var jsFiddleTagCount = 4;
var totalTagCount = 0;

var minContainerR = 100;
var minBallPercentageOfContainerR = 0.15;
var maxBallPercentageOfContainerR = 0.35;
var speedPercentageOfContainerR = 0.003;

var container = document.getElementById('current-areas-of-focus-container');
var containerRect = container.getBoundingClientRect();
var containerParentRect = container.parentElement.getBoundingClientRect();
var mainFooterRect = $('#main-footer')[0].getBoundingClientRect();
var containerHeight = mainFooterRect.top - containerParentRect.bottom;
var containerWidth = containerRect.right - containerRect.left;
minContainerR = containerWidth < minContainerR ? containerWidth : minContainerR;
var containerR = (containerHeight < containerWidth ? containerHeight : containerWidth) / 2;
containerR = containerR < minContainerR ? minContainerR : containerR;

var speed = speedPercentageOfContainerR * containerR;
var textSize = containerR / 20;
var textLineSpacing = containerR / 20;

var svgNamespace = 'http://www.w3.org/2000/svg';
var svg = document.createElementNS(svgNamespace, 'svg');
svg.id = 'svg-wrapper';
$('#current-areas-of-focus-container').append(svg);

var balls = [];

calculateTotalTagCount();
getStackOverflowTags();
getJSFiddleTags();

function calculateTotalTagCount() {
  var tagCounts = [stackOverflowTagCount, jsFiddleTagCount];
  var curTotalTagCount = 0;
  
  $.each(tagCounts, function() {
      curTotalTagCount += this;
  });
  
  totalTagCount = curTotalTagCount;
}

function getJSFiddleTags() {
  $.getJSON('http://jsfiddle.net/api/user/' + jsFiddleUserId + '/demo/list.json?limit=' + jsFiddleTagCount + '&sort=date&order=desc&callback=?', function(data) {
    jsFiddleTagCount = data.list.length;
    calculateTotalTagCount();
    
    var tagUsageCounts = [];
    
    $.each(data.list, function(key, val) {
      tagUsageCounts.push(val.latest_version);
    });
    
    var minAndMaxTagUsageCounts = getMinAndMaxValues(tagUsageCounts);
    
    $.each(data.list, function(key, val) {
      createBall(minAndMaxTagUsageCounts, val.latest_version, val.title, val.description);
  
      if (key >= jsFiddleTagCount - 1) {
        return false;
      }
    });
  });
}

function getStackOverflowTags() {
  $.getJSON('https://api.stackexchange.com/2.2/users/' + stackOverflowUserId + '/tags?sort=popular&order=desc&pagesize=' + stackOverflowTagCount + '&page=1&site=stackoverflow', function(data) {
    stackOverflowTagCount = data.items.length;
    calculateTotalTagCount();
    
    var tags = [];
    var tagUsageCounts = [];
    
    $.each(data.items, function(key, val) {
      tags.push(val.name);
      tagUsageCounts.push(val.count);
    });
    
    var tagDescriptions = [];
    
    $.getJSON('https://api.stackexchange.com/2.2/tags/' + tags.join(';') + '/wikis?site=stackoverflow', function(tagDetailData) {
      $.each(tagDetailData.items, function(key, val) {
        tagDescriptions[val.tag_name] = val.excerpt;
      });
    });
    
    var minAndMaxTagUsageCounts = getMinAndMaxValues(tagUsageCounts);
    
    $.each(data.items, function(key, val) {
      createBall(minAndMaxTagUsageCounts, val.count, val.name.replace(/\-/g, ' '), tagDescriptions[val.name]);
  
      if (key >= stackOverflowTagCount - 1) {
        return false;
      }
    });
  });
}

function getMinAndMaxValues(values) {
  var min = Number.MAX_VALUE;
  var max = Number.MIN_VALUE;
  
  $.each(values, function(key, val) {
    if (val < min) {
      min = val;
    }
    
    if (val > max) {
      max = val;
    }
  });
  
  return [min, max];
}

function createBall(minAndMaxTagUsageCounts, tagUsageCount, title, description) {
  var minTagUsageCount = minAndMaxTagUsageCounts[0]
  var maxTagUsageCount = minAndMaxTagUsageCounts[1];
  var imageSource = '/images/' + title.toLowerCase().replace(/[^a-zA-Z\d]+/g, '-') + '.png';
  
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
      pushBall(minTagUsageCount, maxTagUsageCount, tagUsageCount, dominantColorRGB, imageSource, title, description);
      checkIfAllBallsHaveBeenPushed();
    };
  }).fail(function() {
      pushBall(minTagUsageCount, maxTagUsageCount, tagUsageCount, randomColor({hue: 'random', luminosity: 'bright', count: 1}), null, title, description);
      checkIfAllBallsHaveBeenPushed();
  });
}

function pushBall(minTagUsageCount, maxTagUsageCount, curTagUsageCount, color, imageSource, title, description) {
  var minBallR = minBallPercentageOfContainerR * containerR;
  var maxBallR = maxBallPercentageOfContainerR * containerR;
  var ballRRange = maxBallR - minBallR;
  var tagUsageCountRange = maxTagUsageCount - minTagUsageCount;
  var ballR = (ballRRange * (curTagUsageCount - minTagUsageCount) / tagUsageCountRange) + minBallR;
  balls.push(getBall(containerR * (Math.random() + 0.5), containerR * (Math.random() + 0.5), (Math.random() < 0.5 ? -1 : 1) * speed, (Math.random() < 0.5 ? -1 : 1) * speed, ballR, color, imageSource, title, description));
}

function checkIfAllBallsHaveBeenPushed() {
  if (balls.length == totalTagCount) {
    initDrawing();
    setInterval(moveBalls, 10);
  }
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
	
  for (var i = 0; i < balls.length; i++) {
    var curBall = balls[i];
    
    var curBallBackground = document.createElementNS(svgNamespace, 'circle');
    curBallBackground.id = 'ball-' + i;
    curBallBackground.setAttributeNS(null, 'cx', curBall.x);
    curBallBackground.setAttributeNS(null, 'cy', curBall.y);
    curBallBackground.setAttributeNS(null, 'r',  curBall.r);
    curBallBackground.setAttributeNS(null, 'fill', curBall.color);
    curBallBackground.style.cursor = 'pointer';

    if (curBall.image !== null) {
      var curBallImage = document.createElementNS(svgNamespace, 'image');
      curBallImage.id = 'ball-' + i + '-image';
      curBallImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', curBall.image);
      curBallImage.setAttributeNS(null,'height', curBall.r * 1.4);
      curBallImage.setAttributeNS(null,'width', curBall.r * 1.4);
      curBallImage.setAttributeNS(null,'x', curBall.x - (curBall.r * 0.7));
      curBallImage.setAttributeNS(null,'y', curBall.y - (curBall.r * 0.7));
      curBallImage.style.cursor = 'pointer';
      $('#svg-wrapper').append(curBallBackground);
      $('#svg-wrapper').append(curBallImage);
    } else {
			var curBallText = document.createElementNS(svgNamespace, 'text');
      curBallText.id = 'ball-' + i + '-text';
      curBallText.setAttributeNS(null,'x', curBall.x);
      curBallText.setAttributeNS(null,'y', curBall.y);
      curBallText.setAttributeNS(null, 'fill', '#000');
      curBallText.style.cursor = 'pointer';
      $('#svg-wrapper').append(curBallBackground);
      $('#svg-wrapper').append(curBallText);
      var titleWords = curBall.title.toUpperCase().split(' ');
      for (var j = 0; j < titleWords.length; j++) {
        var curTitleWordTextSpan = document.createElementNS(svgNamespace, 'tspan');
        curTitleWordTextSpan.setAttributeNS(null,'dy', textLineSpacing + 'px');
        curTitleWordTextSpan.textContent = titleWords[j];
        $('#ball-' + i + '-text').append(curTitleWordTextSpan);
        curTitleWordTextSpan.setAttributeNS(null,'x', curBall.x - (curTitleWordTextSpan.getComputedTextLength() / 2));
      }
      curBallText.setAttributeNS(null,'x', curBall.x - (curBallText.getComputedTextLength() / 2));
      curBallText.setAttributeNS(null,'y', curBall.y - (textSize + ((titleWords.length - 1) * textLineSpacing)) / 2);
    }
  }
}

function moveBalls() {
  for (var i = 0; i < balls.length; i++) {
    if (! $('#ball-' + i).filter(function() { return $(this).is(':hover'); }).length
    		&& ! $('#ball-' + i + '-image').filter(function() { return $(this).is(':hover'); }).length
    		&& ! $('#ball-' + i + '-text').filter(function() { return $(this).is(':hover'); }).length) {
		  moveBall(i);
    }
  }
}

function moveBall(i) {
  ball = balls[i];
  
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  var dx = ball.x - containerR;
  var dy = ball.y - containerR;
  var distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

  if (distanceFromCenter >= containerR - ball.r) {
    var normalMagnitude = distanceFromCenter;
    var normalX = dx / normalMagnitude;
    var normalY = dy / normalMagnitude;
    var tangentX = -normalY;
    var tangentY = normalX;
    var normalSpeed = -(normalX * ball.dx + normalY * ball.dy);
    var tangentSpeed = tangentX * ball.dx + tangentY * ball.dy;
    ball.dx = normalSpeed * normalX + tangentSpeed * tangentX;
    ball.dy = normalSpeed * normalY + tangentSpeed * tangentY;
  }
  
  var background = $('#ball-' + i)[0];
  background.setAttributeNS(null, 'cx', ball.x);
  background.setAttributeNS(null, 'cy', ball.y);

  if (ball.image !== null) {
    var ballImage = $('#ball-' + i + '-image')[0];
    ballImage.setAttributeNS(null,'x', ball.x - (ball.r * 0.7));
    ballImage.setAttributeNS(null,'y', ball.y - (ball.r * 0.7));
  } else {
		var ballText = $('#ball-' + i + '-text')[0];
    var titleWords = ball.title.toUpperCase().split(' ');
    for (var j = 0; j < titleWords.length; j++) {
		  var curTitleWordTextSpan = ballText.children[j];
      curTitleWordTextSpan.setAttributeNS(null,'x', ball.x - (curTitleWordTextSpan.getComputedTextLength() / 2));
    }
    ballText.setAttributeNS(null,'x', ball.x - (ballText.getComputedTextLength() / 2));
    ballText.setAttributeNS(null,'y', ball.y - (textSize + ((titleWords.length - 1) * textLineSpacing)) / 2);
  }
}