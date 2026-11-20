(() => {
  const orientation = window.screen.orientation;
  function update() {
    const angle = orientation?.angle || window.orientation || 0;
    document.body.dataset.turn = (angle + 360) % 360 === 270 ? "opposite" : "primary";
  }
  orientation?.addEventListener("change", update);
  window.addEventListener("orientationchange", update);
  window.addEventListener("resize", update);
  update();
})();
