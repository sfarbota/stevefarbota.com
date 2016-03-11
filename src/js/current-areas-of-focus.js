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
      createBall(minAndMaxTagUsageCounts, val.latest_version, val.title, val.description);
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
            createBall(minAndMaxTagUsageCounts, val.count, val.name.replace(/\-/g, ' '), tagDescriptions[val.name]);
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
                  createBall(minAndMaxTagUsageCounts, gitHubTagUsageCounts[key2], key2.replace(/\-/g, ' '), gitHubTagDescriptions[key2]);
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

function createBall(minAndMaxTagUsageCounts, tagUsageCount, title, description, imageFileExtensionIndex) {
  imageFileExtensionIndex = imageFileExtensionIndex || 0;
  var imageSource = '/images/current-areas-of-focus/' + title.toLowerCase().replace(/[^a-zA-Z\d]+/g, '-') + '.' + imageFileExtensions[imageFileExtensionIndex];
  
  $.get(imageSource).done(function() {
    foundImage = true;
    var image = new Image(100, 100);
    image.src = imageSource;
    
    image.onload = function() {
      var colors = (new ColorThief()).getPalette(image, 5, 10);
      var dominantColor = null;
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
        dominantColor = randomColor({hue: 'random', luminosity: 'bright', count: 1});
      } else {
        dominantColor = 'rgb(' + dominantColor.join(',') + ')';
      }
      pushBall(minAndMaxTagUsageCounts, tagUsageCount, dominantColor, imageSource, title, description);
      checkIfAllBallsHaveBeenPushed();
    };
  }).fail(function() {
    if (imageFileExtensionIndex < imageFileExtensions.length - 1) {
      createBall(minAndMaxTagUsageCounts, tagUsageCount, title, description, imageFileExtensionIndex + 1)
    } else {
      pushBall(minAndMaxTagUsageCounts, tagUsageCount, randomColor({hue: 'random', luminosity: 'bright', count: 1}), null, title, description);
      checkIfAllBallsHaveBeenPushed();
    }
  });
}

function pushBall(minAndMaxTagUsageCounts, curTagUsageCount, color, imageSource, title, description) {
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
      : (ballRRange * (curTagUsageCount - minTagUsageCount) / tagUsageCountRange) + minBallR;
  balls.push(getBall(containerR * (Math.random() + 0.5), containerR * (Math.random() + 0.5), (Math.random() < 0.5 ? -1 : 1) * speed, (Math.random() < 0.5 ? -1 : 1) * speed, ballR, color, imageSource, title, description));
}

function checkIfAllBallsHaveBeenPushed() {
  if (balls.length === totalTagCount) {
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
    
    var curBallPopup = document.createElementNS(svgNamespace,'rect');
    curBallPopup.id = 'ball-' + i + '-popup';
    curBallPopup.setAttributeNS(null,'x', curBall.x - (containerR / 2));
    curBallPopup.setAttributeNS(null,'y', curBall.y + (curBall.r * (3 / 4)));
    curBallPopup.setAttributeNS(null,'width', containerR);
    curBallPopup.setAttributeNS(null,'height', containerR);
    curBallPopup.setAttributeNS(null, 'fill', '#fff');
    curBallPopup.style.cursor = 'pointer';
    curBallPopup.style.visibility = 'hidden';

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
    
    $('#svg-wrapper').append(curBallPopup);
  }
}

function moveBalls() {
  for (var i = 0; i < balls.length; i++) {
    var ballPopup = $('#ball-' + i + '-popup')[0];
    
    if (! $('#ball-' + i).filter(function() { return $(this).is(':hover'); }).length
    		&& ! $('#ball-' + i + '-image').filter(function() { return $(this).is(':hover'); }).length
    		&& ! $('#ball-' + i + '-text').filter(function() { return $(this).is(':hover'); }).length
    		&& ! $('#ball-' + i + '-popup').filter(function() { return $(this).is(':hover'); }).length) {
      ballPopup.style.visibility = 'hidden';
		  moveBall(i);
    } else {
      ballPopup.style.visibility = 'visible';
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
  
  var ballBackground = $('#ball-' + i)[0];
  ballBackground.setAttributeNS(null, 'cx', ball.x);
  ballBackground.setAttributeNS(null, 'cy', ball.y);

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
  
  var ballPopup = $('#ball-' + i + '-popup')[0];
  ballPopup.setAttributeNS(null,'x', ball.x - (containerR / 2));
  ballPopup.setAttributeNS(null,'y', ball.y + (ball.r * (3 / 4)));
}