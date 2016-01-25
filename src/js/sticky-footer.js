function positionMainFooter() {
  var mainContentWrapper = $("#main-content-wrapper");
  var titleBar = $(".title-bar");
  var mainContent = $("#main-content");
  var offCanvasWrapper = $(".off-canvas-wrapper");
  var offCanvasWrapperInner = $(".off-canvas-wrapper-inner");
  var pageWrapper = $(".off-canvas-content");
  var offCanvasContent = $("#page-wrapper");
  var mainFooter = $("#main-footer");
  if ($(document.body).height() >=
        (titleBar.outerHeight() + mainContent.outerHeight() + mainFooter.outerHeight())) {
    mainFooter.css({
      marginTop: "-85px"
    });
    offCanvasWrapper.css({
      height: "100%"
    });
    offCanvasWrapperInner.css({
      height: "100%"
    });
    offCanvasContent.css({
      height: "100%"
    });
    pageWrapper.css({
      height: "100%"
    });
  } else if ($(document.body).height() <
        (titleBar.outerHeight() + mainContent.outerHeight() + mainFooter.outerHeight())) {
    mainFooter.css({
      marginTop: "0"
    });
    offCanvasWrapper.css({
      height: "auto"
    });
    offCanvasWrapperInner.css({
      height: "auto"
    });
    offCanvasContent.css({
      height: "auto"
    });
    pageWrapper.css({
      height: "auto"
    });
  }
}

$(document).ready(function() {
  positionMainFooter();
  $(window)
    .scroll(positionMainFooter);
  $(window)
    .resize(positionMainFooter);
  $(window)
    .load(positionMainFooter);
});