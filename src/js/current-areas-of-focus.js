var XTextAlignment = Object.freeze({
  LEFT: 0,
  CENTER: 0.5,
  RIGHT: 1
});
var YTextAlignment = Object.freeze({
  TOP: 0,
  MIDDLE: 0.5,
  BOTTOM: 1
});
var Source = Object.freeze({
  GITHUB: 'GitHub',
  JSFIDDLE: 'JSFiddle',
  STACK_OVERFLOW: 'Stack Overflow'
});

var imageFileExtensions = ['svg', 'png'];

var stackOverflowUserId = 170309;
var stackOverflowTagCount = 4;
var stackOverflowMaxTagAgeInMonths = 12;

var gitHubUserId = 'sfarbota';
var gitHubTagCount = 1;
var gitHubMaxTagAgeInMonths = 12;
var gitHubTagDescriptions = {};
var gitHubTagUsageCounts=[];

var jsFiddleUserId = 'sfarbota';
var jsFiddleTagCount = 3;

var totalTagCount = 0;

var minContainerR = 100;
var minBallPercentageOfContainerR = 0.15;
var maxBallPercentageOfContainerR = 0.35;
var speedPercentageOfContainerR = 0.003;
var minBallBackgroundRGBDifference = 75;

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
var baseTextSize = containerR / 20;
var baseTextLineSpacing = containerR / 15;
var ballTitleTextSizeMultiplier = 1;
var ballPopupTitleTextSizeMultiplier = 2;
var ballPopupDescriptionTextSizeMultiplier = 1;
var ballPopupBackgroundWidth = containerR;
var ballPopupOuterPadding = (ballPopupBackgroundWidth / 10);
var ballPopupInnerPadding = (ballPopupBackgroundWidth / 20);
var ballPopupDistancePercent = 0.67;
var ballPopupDistancePercentXY = Math.sqrt(Math.pow(ballPopupDistancePercent, 2) / 2);

var svgNamespace = 'http://www.w3.org/2000/svg';
var svg = document.createElementNS(svgNamespace, 'svg');
svg.id = 'svg-wrapper';
container.appendChild(svg);

var balls = [];

calculateTotalTagCount();
getStackOverflowTags();
getGitHubTags();
getJSFiddleTags();

function calculateTotalTagCount() {
  var tagCounts = [stackOverflowTagCount, gitHubTagCount, jsFiddleTagCount];
  var curTotalTagCount = 0;
  
  $.each(tagCounts, function() {
      curTotalTagCount += this;
  });
  
  totalTagCount = curTotalTagCount;
}

function getJSFiddleTags() {
  $.getJSON('http://jsfiddle.net/api/user/' + jsFiddleUserId + '/demo/list.json'
      + '?sort=date'
      + '&order=desc'
      + '&limit=' + jsFiddleTagCount
      + '&callback=?',
      function(data) {
    jsFiddleTagCount = data.list.length;
    calculateTotalTagCount();
    
    var tagUsageCounts = [];
    
    $.each(data.list, function(key, val) {
      tagUsageCounts.push(val.latest_version);
    });
    
    var minAndMaxTagUsageCounts = getMinAndMaxValues(tagUsageCounts);
    
    $.each(data.list, function(key, val) {
      getBallTagImage(minAndMaxTagUsageCounts, val.latest_version, val.title, val.description, Source.JSFIDDLE);
    });
  });
}

function getStackOverflowTags(tagAgeInMonths) {
  tagAgeInMonths = tagAgeInMonths || 1;
  
  if (tagAgeInMonths <= stackOverflowMaxTagAgeInMonths) {
    $.getJSON('https://api.stackexchange.com/2.2/users/' + stackOverflowUserId + '/tags'
        + '?site=stackoverflow'
        + '&sort=popular'
        + '&order=desc'
        + '&fromdate=' + Math.round(new Date().setDate((new Date()).getDate() - (30 * tagAgeInMonths)) / 1000)
        + '&pagesize=' + stackOverflowTagCount
        + '&page=1',
        function(data) {
      if (data.items.length === 0) {
        getStackOverflowTags(tagAgeInMonths + 1);
      } else {
        stackOverflowTagCount = data.items.length;
        calculateTotalTagCount();
        
        var tags = [];
        var tagUsageCounts = [];
        
        $.each(data.items, function(key, val) {
          tags.push(val.name);
          tagUsageCounts.push(val.count);
        });
        
        var tagDescriptions = [];
        
        $.getJSON('https://api.stackexchange.com/2.2/tags/' + tags.join(';') + '/wikis'
            + '?site=stackoverflow',
            function(tagDetailData) {
          $.each(tagDetailData.items, function(key, val) {
            tagDescriptions[val.tag_name] = val.excerpt;
          });
        
          var minAndMaxTagUsageCounts = getMinAndMaxValues(tagUsageCounts);
          
          $.each(data.items, function(key, val) {
            getBallTagImage(minAndMaxTagUsageCounts, val.count, val.name.replace(/\-/g, ' '), tagDescriptions[val.name], Source.STACK_OVERFLOW);
          });
        });
      }
    });
  } else {
    stackOverflowTagCount = 0;
    calculateTotalTagCount();
  }
}

function getGitHubTags(tagAgeInMonths) {
  tagAgeInMonths = tagAgeInMonths || 1;
  
  if (tagAgeInMonths <= gitHubMaxTagAgeInMonths) {
    $.getJSON('https://api.github.com/users/' + gitHubUserId + '/repos'
        + '?type=all'
        + '&sort=updated'
        + '&direction=desc',
        function(data) {
      if (data.length === 0) {
        getGitHubTags(tagAgeInMonths + 1);
      } else {
        if (data.length < gitHubTagCount) {
          gitHubTagCount = data.length;
          calculateTotalTagCount();
        }
        
        $.each(data, function(key, val) {
          if (key < gitHubTagCount) {
            gitHubTagDescriptions[val.name] = val.description;
            
            var sinceDate = new Date();
            sinceDate.setDate((new Date()).getDate() - (30 * tagAgeInMonths));
            
            $.getJSON('https://api.github.com/repos/' + gitHubUserId + '/' + val.name + '/commits'
                + '?since=' + sinceDate.toISOString()
                , function(commitData) {
              gitHubTagUsageCounts.push(commitData.length);
              
              if (key === gitHubTagCount - 1) {
                var minAndMaxTagUsageCounts = getMinAndMaxValues(gitHubTagUsageCounts);
                
                $.each(gitHubTagDescriptions, function(key2, val2) {
                  getBallTagImage(minAndMaxTagUsageCounts, gitHubTagUsageCounts[key2], key2.replace(/\-/g, ' '), gitHubTagDescriptions[key2], Source.GITHUB);
                });
              }
            });
          }
        });
      }
    });
  } else {
    gitHubTagCount = 0;
    calculateTotalTagCount();
  }
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

function getBallTagImage(minAndMaxTagUsageCounts, tagUsageCount, title, description, source, imageFileExtensionIndex) {
  imageFileExtensionIndex = imageFileExtensionIndex || 0;
  var tagImageSource = '/images/current-areas-of-focus/tags/' + title.toLowerCase().replace(/[^a-zA-Z\d]+/g, '-') + '.' + imageFileExtensions[imageFileExtensionIndex];
  
  $.get(tagImageSource).done(function() {
    var tagImage = new Image(100, 100);
    tagImage.src = tagImageSource;
    
    tagImage.onload = function() {
      var colors = (new ColorThief()).getPalette(tagImage, 5, 10);
      var dominantColor = null;
      var i = 0;
      while (dominantColor === null && i < colors.length) {
        var curColor = colors[i];
        if (! (Math.abs(curColor[0] - curColor[1]) < minBallBackgroundRGBDifference
            && Math.abs(curColor[0] - curColor[2]) < minBallBackgroundRGBDifference
            && Math.abs(curColor[1] - curColor[2]) < minBallBackgroundRGBDifference)) {
          dominantColor = curColor;
        }
        i++;
      }
      if (dominantColor === null) {
        dominantColor = randomColor({hue: 'random', luminosity: 'bright', count: 1});
      } else {
        dominantColor = 'rgb(' + dominantColor.join(',') + ')';
      }
      getBallSourceImage(minAndMaxTagUsageCounts, tagUsageCount, dominantColor, title, description, source, tagImageSource);
    };
  }).fail(function() {
    if (imageFileExtensionIndex < imageFileExtensions.length - 1) {
      getBallTagImage(minAndMaxTagUsageCounts, tagUsageCount, title, description, source, imageFileExtensionIndex + 1)
    } else {
      getBallSourceImage(minAndMaxTagUsageCounts, tagUsageCount, randomColor({hue: 'random', luminosity: 'bright', count: 1}), title, description, source, null);
    }
  });
}

function getBallSourceImage(minAndMaxTagUsageCounts, tagUsageCount, color, title, description, source, tagImageSource, imageFileExtensionIndex) {
  imageFileExtensionIndex = imageFileExtensionIndex || 0;
  var sourceImageSource = '/images/current-areas-of-focus/sources/' + source.toLowerCase().replace(/[^a-zA-Z\d]+/g, '-') + '.' + imageFileExtensions[imageFileExtensionIndex];
  
  $.get(sourceImageSource).done(function() {
    pushBall(minAndMaxTagUsageCounts, tagUsageCount, color, title, description, source, tagImageSource, sourceImageSource);
    checkIfAllBallsHaveBeenPushed();
  }).fail(function() {
    if (imageFileExtensionIndex < imageFileExtensions.length - 1) {
      getBallSourceImage(minAndMaxTagUsageCounts, tagUsageCount, color, title, description, source, tagImageSource, imageFileExtensionIndex + 1)
    } else {
      pushBall(minAndMaxTagUsageCounts, tagUsageCount, color, title, description, source, tagImageSource, null);
      checkIfAllBallsHaveBeenPushed();
    }
  });
}

function pushBall(minAndMaxTagUsageCounts, tagUsageCount, color, title, description, source, tagImageSource, sourceImageSource) {
  var minTagUsageCount = minAndMaxTagUsageCounts[0]
  var maxTagUsageCount = minAndMaxTagUsageCounts[1];
  var minBallR = minBallPercentageOfContainerR * containerR;
  var maxBallR = maxBallPercentageOfContainerR * containerR;
  var ballRRange = maxBallR - minBallR;
  var tagUsageCountRange = maxTagUsageCount - minTagUsageCount;
  var tagUsageCountThresholdIfEqual = 1;
  var ballR = minTagUsageCount === maxTagUsageCount
      ? maxTagUsageCount > tagUsageCountThresholdIfEqual
        ? maxBallR
        : minBallR
      : (ballRRange * (tagUsageCount - minTagUsageCount) / tagUsageCountRange) + minBallR;
  var randomX = containerR * (Math.random() + 0.5);
  var randomY = containerR * (Math.random() + 0.5);
  var randomDx = (Math.random() < 0.5 ? -1 : 1) * speed;
  var randomDy = (Math.random() < 0.5 ? -1 : 1) * speed;
  
  balls.push({
      x: randomX,
      y: randomY,
      originalX: randomX,
      originalY: randomY,
      dx: randomDx,
      dy: randomDy,
      r: ballR,
      color: color,
      title: title,
      description: description,
      source: source,
      tagImage: tagImageSource,
      sourceImage: sourceImageSource
  });
}

function checkIfAllBallsHaveBeenPushed() {
  if (balls.length === totalTagCount) {
    initDrawing();
    setInterval(moveBalls, 10);
  }
}

function initDrawing() {
  svg.style.width = containerR * 2 + 'px';
  svg.style.height = containerR * 2 + 'px';
	svg.style.font = baseTextSize + 'px Arial';
	svg.style.overflow = 'visible';
    
  var svgBackground = document.createElementNS(svgNamespace, 'circle');
  svgBackground.id = 'ball-' + i + '-background';
  svgBackground.setAttribute('cx', containerR);
  svgBackground.setAttribute('cy', containerR);
  svgBackground.setAttribute('r',  containerR);
  svgBackground.setAttribute('fill', '#eee');
  svg.appendChild(svgBackground);
	
  for (var i = 0; i < balls.length; i++) {
    var curBall = balls[i];
    
    var curBallGroup = document.createElementNS(svgNamespace, 'g');
    curBallGroup.id = 'ball-' + i + '-group';
    curBallGroup.style.cursor = 'pointer';
    curBallGroup.setAttribute('x', 0);
    curBallGroup.setAttribute('y', 0)
    svg.appendChild(curBallGroup);
    
    var curBallBackground = document.createElementNS(svgNamespace, 'circle');
    curBallBackground.id = 'ball-' + i + '-background';
    curBallBackground.setAttribute('cx', curBall.x);
    curBallBackground.setAttribute('cy', curBall.y);
    curBallBackground.setAttribute('r',  curBall.r);
    curBallBackground.setAttribute('fill', curBall.color);
    curBallGroup.appendChild(curBallBackground);

    if (curBall.tagImage !== null) {
      var curBallTagImage = document.createElementNS(svgNamespace, 'image');
      curBallTagImage.id = 'ball-' + i + '-tag-image';
      curBallTagImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', curBall.tagImage);
      curBallTagImage.setAttribute('height', curBall.r * 1.4);
      curBallTagImage.setAttribute('width', curBall.r * 1.4);
      curBallTagImage.setAttribute('x', curBall.x - (curBall.r * 0.7));
      curBallTagImage.setAttribute('y', curBall.y - (curBall.r * 0.7));
      curBallGroup.appendChild(curBallTagImage);
    } else {
      var maxTextWidth = Math.sqrt((Math.pow(curBall.r * 2, 2) / 2));
			var curBallText = createMultiLineSVGTextElement(
			    curBall.title.toUpperCase(),
			    curBallGroup,
			    maxTextWidth,
			    curBall.x,
			    curBall.y,
			    ballTitleTextSizeMultiplier,
			    XTextAlignment.CENTER,
			    YTextAlignment.MIDDLE)
      curBallText.id = 'ball-' + i + '-text';
      curBallText.setAttribute('fill', '#000');
    }
    
    var curBallPopupGroup = document.createElementNS(svgNamespace, 'g');
    curBallPopupGroup.id = 'ball-' + i + '-popup-group';
    curBallPopupGroup.style.visibility = 'hidden';
    curBallGroup.appendChild(curBallPopupGroup);
    
    var curBallPopupBackground = document.createElementNS(svgNamespace,'rect');
    curBallPopupBackground.id = 'ball-' + i + '-popup-background';
    curBallPopupBackground.setAttribute('x', curBall.x + (curBall.r * ballPopupDistancePercentXY));
    curBallPopupBackground.setAttribute('y', curBall.y + (curBall.r * ballPopupDistancePercentXY));
    curBallPopupBackground.setAttribute('width', ballPopupBackgroundWidth);
    curBallPopupBackground.setAttribute('height', containerR / 2);
    curBallPopupBackground.setAttribute('fill', '#fff');
    curBallPopupBackground.style.boxShadow = '0px 2px 6px 3px rgba(0,0,0,0.4)';
    curBallPopupGroup.appendChild(curBallPopupBackground);

    var ballPopupTitleXPadding = ballPopupOuterPadding;

    if (curBall.sourceImage !== null) {
      var curBallPopupSourceImage = document.createElementNS(svgNamespace, 'image');
      curBallPopupSourceImage.id = 'ball-' + i + '-popup-source-image';
      curBallPopupSourceImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', curBall.sourceImage);
      curBallPopupSourceImage.setAttribute('height', ballPopupOuterPadding + ballPopupTitleTextSizeMultiplier);
      curBallPopupSourceImage.setAttribute('width', ballPopupOuterPadding + ballPopupTitleTextSizeMultiplier);
      curBallPopupSourceImage.setAttribute('x', parseFloat(curBallPopupBackground.getAttribute('x')) + ballPopupOuterPadding);
      curBallPopupSourceImage.setAttribute('y', parseFloat(curBallPopupBackground.getAttribute('y')) + ballPopupOuterPadding);
      curBallPopupGroup.appendChild(curBallPopupSourceImage);
      
      ballPopupTitleXPadding =
          ballPopupOuterPadding
          + curBallPopupSourceImage.getBoundingClientRect().width
          + ballPopupInnerPadding;
    }
    
    var curBallPopupTitle = createMultiLineSVGTextElement(
        curBall.title,
        curBallPopupGroup,
        ballPopupBackgroundWidth
            - ballPopupTitleXPadding
            - ballPopupOuterPadding,
        parseFloat(curBallPopupBackground.getAttribute('x'))
            + ballPopupTitleXPadding,
        parseFloat(curBallPopupBackground.getAttribute('y'))
            + ballPopupOuterPadding,
        ballPopupTitleTextSizeMultiplier,
        XTextAlignment.LEFT,
        YTextAlignment.TOP);
    curBallPopupTitle.id = 'ball-' + i + '-popup-title';
    curBallPopupTitle.setAttribute('fill', '#000');
    
    var curBallPopupDescription = createMultiLineSVGTextElement(
        curBall.description,
        curBallPopupGroup,
        ballPopupBackgroundWidth
            - ballPopupOuterPadding
            - ballPopupOuterPadding,
        parseFloat(curBallPopupBackground.getAttribute('x'))
            + ballPopupOuterPadding,
        parseFloat(curBallPopupBackground.getAttribute('y'))
            + ballPopupOuterPadding
            + curBallPopupTitle.getBoundingClientRect().height
            + ballPopupInnerPadding,
        ballPopupDescriptionTextSizeMultiplier,
        XTextAlignment.LEFT,
        YTextAlignment.TOP);
    curBallPopupDescription.id = 'ball-' + i + '-popup-description';
    curBallPopupDescription.setAttribute('fill', '#000');
    
    curBallPopupBackground.setAttribute('height',
        ballPopupOuterPadding
        + curBallPopupTitle.getBoundingClientRect().height
        + ballPopupInnerPadding
        + curBallPopupDescription.getBoundingClientRect().height
        + ballPopupOuterPadding
    );
  }
}

function createMultiLineSVGTextElement(text, parentElement, maxLineWidth, x, y, textSizeMultiplier, xTextAlignment, yTextAlignment) {
  var textSize = baseTextSize * textSizeMultiplier;
  var textLineSpacing = baseTextLineSpacing * textSizeMultiplier;
  
  var svgTextElement = document.createElementNS(svgNamespace,'text');
  parentElement.appendChild(svgTextElement);
  svgTextElement.setAttribute('x', x);
  svgTextElement.setAttribute('y', y);
  svgTextElement.style.font = textSize + 'px Arial';
  
  var words = text.split(' ');
  var curLineTextSpanElement = document.createElementNS(svgNamespace, 'tspan');
  curLineTextSpanElement.setAttribute('x', x);
  curLineTextSpanElement.setAttribute('dy', 0);
  svgTextElement.appendChild(curLineTextSpanElement);
  curLineTextSpanElement.textContent = words[0];
  
  for (var i = 1; i < words.length; i++) {
    curLineTextSpanElement.textContent += ' ' + words[i];
    
    if (curLineTextSpanElement.getComputedTextLength() > maxLineWidth) {
      var curLineText = curLineTextSpanElement.textContent
      curLineTextSpanElement.textContent = curLineText.substring(0, curLineText.lastIndexOf(' '));
      alignElementText(curLineTextSpanElement, textSize, textLineSpacing, xTextAlignment);
      
      curLineTextSpanElement = document.createElementNS(svgNamespace, 'tspan');
      curLineTextSpanElement.setAttribute('x', x);
      curLineTextSpanElement.setAttribute('dy', textLineSpacing + 'px');
      svgTextElement.appendChild(curLineTextSpanElement);
      curLineTextSpanElement.textContent = words[i];
    }
  }
    
  alignElementText(curLineTextSpanElement, textSize, textLineSpacing, xTextAlignment);
  alignElementText(svgTextElement, textSize, textLineSpacing, xTextAlignment, yTextAlignment);
  
  return svgTextElement;
}

function moveBalls() {
  for (var i = 0; i < balls.length; i++) {
    moveBallPopup(i);
    
    var curBallGroup = $('#ball-' + i + '-group')[0];
    var curBallPopupGroup = $('#ball-' + i + '-popup-group')[0];
    
    if ($('#ball-' + i + '-group').filter(function() { return $(this).is(':hover'); }).length) {
      curBallGroup.parentNode.appendChild(curBallGroup);
      curBallPopupGroup.style.visibility = 'visible';
    } else {
      curBallPopupGroup.style.visibility = 'hidden';
		  moveBall(i);
    }
  }
}

function alignElementText(element, textSize, textLineSpacing, xTextAlignment, yTextAlignment) {
  if (typeof xTextAlignment != 'undefined') {
    element.setAttribute('x', parseFloat(element.getAttribute('x')) - element.getComputedTextLength() * xTextAlignment);
  }
  if (typeof yTextAlignment != 'undefined') {
    element.setAttribute('y', parseFloat(element.getAttribute('y')) - ((element.childNodes.length - 1) * textLineSpacing + textSize) * yTextAlignment + textSize);
  }
}

function moveBallPopup(i) {
  var ball = balls[i];
  var ballPopupBackgroundRect = $('#ball-' + i + '-popup-background')[0].getBoundingClientRect();
  var xTranslate = 0;
  var yTranslate = 0;
  
  if (ball.x > containerR){
    xTranslate = -(ball.r * ballPopupDistancePercentXY * 2 + ballPopupBackgroundRect.width);
  }
  if (ball.y > containerR){
    yTranslate = -(ball.r * ballPopupDistancePercentXY * 2 + ballPopupBackgroundRect.height);
  }
  
  $('#ball-' + i + '-popup-group')[0].setAttribute('transform', 'translate(' + xTranslate + ', ' + yTranslate + ')');
}

function moveBall(i) {
  ball = balls[i];
  
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
  
  ball.x += ball.dx;
  ball.y += ball.dy;
  
  $('#ball-' + i + '-group')[0].setAttribute('transform', 'translate(' + (ball.x - ball.originalX) + ', ' + (ball.y - ball.originalY) + ')');
}