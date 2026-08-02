(function () {
  try {
    var path = window.location.pathname || "/";
    if (path === "/maintenance" || path.indexOf("/api/maintenance") === 0) return;
    if (
      path === "/admin/login" ||
      path.indexOf("/api/admin/login") === 0 ||
      path.indexOf("/api/admin/verify-2fa") === 0 ||
      path.indexOf("/api/admin/2fa/") === 0
    ) {
      return;
    }
    var cookie = document.cookie || "";
    if (
      (path === "/admin" || path.indexOf("/admin/") === 0 || path.indexOf("/api/admin/") === 0) &&
      (cookie.indexOf("admin_user=") !== -1 || cookie.indexOf("admin_id=") !== -1)
    ) {
      return;
    }
    fetch("/api/maintenance?ts=" + Date.now(), {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (payload) {
        if (payload && payload.success && payload.data && payload.data.isEnabled) {
          window.location.replace("/maintenance");
        }
      })
      .catch(function () {});
  } catch (error) {}
})();
