$(function(){
  'use strict';
  var $page = $('#wrapper'),
      options = {
        debug: true,
        prefetch: true,
        cacheLength: 0,
        forms: 'form',
        onStart: {
          duration: 750, // Duration of our animation
          render: function ($container) {
            // Add your CSS animation reversing class
            var timeline = new TimelineMax();
            var poolRadius = 200;
            var angle = Math.random() * Math.PI * 2; //random angle in radians
            var radius = Math.random() * poolRadius;
            
            $container.addClass('is-exiting');
            // Restart your animation
            smoothState.restartCSSAnimations();
            
            timeline.to(".explode .button", 0.75, {x:Math.cos(angle) * radius - 275, y:Math.sin(angle) * radius + 200, ease:Quad.easeInOut}, 0)
              .to(".explode p", 0.75, {x:Math.cos(angle) * radius + 275, y:Math.sin(angle) * radius - 200, ease:Quad.easeInOut}, 0)
              .to(".explode h3", 0.75, {x:Math.cos(angle) * radius - 275, y:Math.sin(angle) * radius - 200, ease:Quad.easeInOut}, 0);
          }
        },
        onReady: {
          duration: 0,
          render: function ($container, $newContent) {
            // Remove your CSS animation reversing class
            $container.removeClass('is-exiting');
            // Inject the new content
            $container.html($newContent);
            
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
            
            $('#explore-playground').click(function() {
              $('.can-explode').addClass('explode');
            });
            
            $(document).foundation();
            positionMainFooter();
          }
        }
      },
      smoothState = $page.smoothState(options).data('smoothState'),
      addAndRestart = function ($container) {
        $container.addClass('is-exiting');
        // Restart your animation
        smoothState.restartCSSAnimations();
      };
});