(() => {
  const cfg = window.SITE_CONFIG || {};
  const configured =
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !String(cfg.supabaseUrl).includes("YOUR_SUPABASE") &&
    !String(cfg.supabaseAnonKey).includes("YOUR_SUPABASE");

  if (!configured || !window.supabase) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const startedAt = Date.now();
  let timeSent = false;

  function visitorId() {
    const key = "tp_vid";
    try {
      let id = localStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(key, id);
      }
      return id;
    } catch {
      return `v_${Date.now()}`;
    }
  }

  function deviceType() {
    const ua = navigator.userAgent || "";
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) return "mobile";
    return "desktop";
  }

  function pagePath() {
    return window.location.pathname || "/";
  }

  function referrerHost() {
    try {
      if (!document.referrer) return "direct";
      const u = new URL(document.referrer);
      if (u.host === window.location.host) return "internal";
      return u.host;
    } catch {
      return "direct";
    }
  }

  async function insert(table, row) {
    try {
      await client.from(table).insert(row);
    } catch (err) {
      console.warn("[analytics]", err);
    }
  }

  function trackEvent(name, label, meta) {
    return insert("events", {
      name,
      path: pagePath(),
      label: label || null,
      visitor_id: visitorId(),
      meta: meta || {}
    });
  }

  function trackPageview() {
    return insert("pageviews", {
      path: pagePath(),
      referrer: referrerHost(),
      visitor_id: visitorId(),
      device: deviceType()
    });
  }

  function sendTimeOnPage() {
    if (timeSent) return;
    const sec = Math.round((Date.now() - startedAt) / 1000);
    if (sec < 2) return;
    timeSent = true;
    const payload = {
      name: "page_time",
      path: pagePath(),
      label: null,
      visitor_id: visitorId(),
      meta: { duration_sec: sec }
    };
    // Prefer beacon so it still fires on tab close
    try {
      const url = `${cfg.supabaseUrl}/rest/v1/events`;
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        // sendBeacon can't set Authorization headers reliably across browsers —
        // fall through to fetch keepalive for Supabase.
      }
    } catch (_) {
      /* ignore */
    }
    fetch(`${cfg.supabaseUrl}/rest/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  }

  function bindTrackedClicks() {
    document.addEventListener(
      "click",
      (e) => {
        const el = e.target.closest("[data-track]");
        if (!el) return;
        const name = el.getAttribute("data-track");
        if (!name) return;
        const label = el.getAttribute("data-track-label") || el.getAttribute("aria-label") || el.textContent.trim().slice(0, 80);
        trackEvent(name, label);
      },
      true
    );
  }

  function injectClarity(projectId) {
    if (!projectId || window.clarity) return;
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", projectId);
  }

  async function loadClarity() {
    // Prefer config (always available), then Settings in Supabase
    if (cfg.clarityProjectId) {
      injectClarity(cfg.clarityProjectId);
      return;
    }
    try {
      const { data } = await client
        .from("site_settings")
        .select("clarity_project_id")
        .eq("id", "main")
        .maybeSingle();
      if (data && data.clarity_project_id) injectClarity(data.clarity_project_id);
    } catch (_) {
      /* ignore */
    }
  }

  // Boot
  trackPageview();
  bindTrackedClicks();
  loadClarity();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendTimeOnPage();
  });
  window.addEventListener("pagehide", sendTimeOnPage);
})();
