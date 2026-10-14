/*! GitPulse embed. Usage:
 *  <div data-gitpulse="octocat" data-config="t=dracula&l=wide"></div>
 *  <script async src="https://YOUR_HOST/embed.js"></script>
 */
(function () {
  var script = document.currentScript;
  if (!script || !script.src) return;
  var origin = new URL(script.src).origin;
  var counter = 0;
  var frames = {};

  function build(el) {
    if (el.getAttribute("data-gp-ready")) return;
    var user = el.getAttribute("data-gitpulse");
    if (!user) return;
    el.setAttribute("data-gp-ready", "1");

    var cfg = el.getAttribute("data-config") || "";
    var id = "gp" + ++counter;
    var iframe = document.createElement("iframe");
    iframe.src = origin + "/w/" + encodeURIComponent(user) + "?" + cfg + (cfg ? "&" : "") + "id=" + id;
    iframe.title = "GitHub activity for " + user;
    iframe.loading = "lazy";
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("allowtransparency", "true");
    iframe.style.cssText =
      "width:100%;border:0;display:block;overflow:hidden;height:" + (el.getAttribute("data-min-height") || "420") + "px";
    frames[id] = iframe;
    el.appendChild(iframe);
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== origin) return;
    var d = e.data;
    if (!d || d.type !== "gitpulse:height") return;
    var f = frames[d.id];
    if (f && d.height) f.style.height = Math.ceil(d.height) + "px";
  });

  function init() {
    var nodes = document.querySelectorAll("[data-gitpulse]");
    for (var i = 0; i < nodes.length; i++) build(nodes[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // For single page apps that render the placeholder after load.
  window.GitPulse = { mount: init };
})();
