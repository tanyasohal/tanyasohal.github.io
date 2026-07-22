(() => {
  const cfg = window.ADMIN_CONFIG || {};
  const configured =
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes("YOUR_SUPABASE") &&
    !cfg.supabaseAnonKey.includes("YOUR_SUPABASE");

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const setupScreen = $("#setup-screen");
  const loginScreen = $("#login-screen");
  const app = $("#app");
  const toastEl = $("#toast");

  let supabase = null;
  let draft = {};
  let settings = { site_url: "", clarity_url: "", clarity_project_id: "" };
  let mediaFiles = [];

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  function showScreen(name) {
    setupScreen.classList.toggle("hidden", name !== "setup");
    loginScreen.classList.toggle("hidden", name !== "login");
    app.classList.toggle("hidden", name !== "app");
  }

  function setTab(tab) {
    $$(".nav-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });
    $$(".tab-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panel !== tab);
    });
  }

  function setContentSection(section) {
    $$("#content-section-tabs .chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.section === section);
    });
    $$(".content-section").forEach((el) => {
      el.classList.toggle("hidden", el.dataset.content !== section);
    });
  }

  function fillContentForm(data) {
    draft = structuredClone(data || {});
    const hero = draft.hero || {};
    const about = draft.about || {};
    const skills = draft.skills || {};
    const writing = draft.writing || {};
    const contact = draft.contact || {};
    const seo = draft.seo || {};
    const paras = about.paragraphs || [];

    $("#hero-greeting").value = hero.greeting || "";
    $("#hero-headline").value = hero.headlineHtml || "";
    $("#hero-resume").value = hero.resumeUrl || "";

    $("#about-title").value = about.title || "";
    $("#about-p1").value = paras[0] || "";
    $("#about-p2").value = paras[1] || "";
    $("#about-p3").value = paras[2] || "";
    $("#about-photo").value = about.photoUrl || "";

    $("#skills-title").value = skills.title || "";
    $("#skills-subtitle").value = skills.subtitle || "";

    $("#writing-title").value = writing.title || "";
    $("#writing-subtitle").value = writing.subtitle || "";
    $("#writing-url").value = writing.substackUrl || "";
    $("#writing-btn").value = writing.buttonLabel || "";

    $("#contact-title").value = contact.title || "";
    $("#contact-intro").value = contact.intro || "";
    $("#contact-email").value = contact.email || "";
    $("#contact-linkedin").value = contact.linkedinUrl || "";
    $("#contact-github").value = contact.githubUrl || "";
    $("#contact-tableau").value = contact.tableauUrl || "";

    $("#seo-title").value = seo.title || "";
    $("#seo-description").value = seo.description || "";
    $("#seo-og").value = seo.ogImage || "";
  }

  function readContentForm() {
    const next = structuredClone(draft || {});
    next.hero = {
      ...(next.hero || {}),
      greeting: $("#hero-greeting").value.trim(),
      headlineHtml: $("#hero-headline").value.trim(),
      resumeUrl: $("#hero-resume").value.trim()
    };
    next.about = {
      ...(next.about || {}),
      title: $("#about-title").value.trim(),
      paragraphs: [
        $("#about-p1").value.trim(),
        $("#about-p2").value.trim(),
        $("#about-p3").value.trim()
      ].filter(Boolean),
      photoUrl: $("#about-photo").value.trim()
    };
    next.skills = {
      ...(next.skills || {}),
      title: $("#skills-title").value.trim(),
      subtitle: $("#skills-subtitle").value.trim(),
      categories: (next.skills && next.skills.categories) || []
    };
    next.writing = {
      ...(next.writing || {}),
      title: $("#writing-title").value.trim(),
      subtitle: $("#writing-subtitle").value.trim(),
      substackUrl: $("#writing-url").value.trim(),
      buttonLabel: $("#writing-btn").value.trim()
    };
    next.contact = {
      ...(next.contact || {}),
      title: $("#contact-title").value.trim(),
      intro: $("#contact-intro").value.trim(),
      email: $("#contact-email").value.trim(),
      linkedinUrl: $("#contact-linkedin").value.trim(),
      githubUrl: $("#contact-github").value.trim(),
      tableauUrl: $("#contact-tableau").value.trim()
    };
    next.seo = {
      ...(next.seo || {}),
      title: $("#seo-title").value.trim(),
      description: $("#seo-description").value.trim(),
      ogImage: $("#seo-og").value.trim()
    };
    draft = next;
    return next;
  }

  function clarityDashboardUrl() {
    if (settings.clarity_url) return settings.clarity_url;
    const id = (settings.clarity_project_id || "").trim();
    if (id) return `https://clarity.microsoft.com/projects/view/${id}`;
    return "";
  }

  function updateClarityLinks() {
    const url = clarityDashboardUrl();
    const pairs = [
      ["#clarity-link", "#clarity-setup-btn"],
      ["#clarity-link-analytics", "#clarity-setup-btn-analytics"]
    ];
    pairs.forEach(([openSel, setupSel]) => {
      const openBtn = $(openSel);
      const setupBtn = $(setupSel);
      if (!openBtn) return;
      if (url) {
        openBtn.classList.remove("hidden");
        openBtn.href = url;
        openBtn.target = "_blank";
        openBtn.rel = "noopener noreferrer";
        openBtn.textContent = "Open Clarity";
        openBtn.onclick = null;
        if (setupBtn) setupBtn.classList.add("hidden");
      } else {
        openBtn.classList.add("hidden");
        openBtn.removeAttribute("href");
        if (setupBtn) setupBtn.classList.remove("hidden");
      }
    });
  }

  const PAGE_LABELS = {
    "/": "Home",
    "/index.html": "Home",
    "/work/oneup.html": "OneUp — user behavior tracking",
    "/work/craigslist.html": "Craigslist — NLP pain points",
    "/work/perrys.html": "Perry's Ice Cream — manufacturing",
    "/work/dvd-warehouse.html": "DVD warehouse — data pipeline",
    "/work/grant-writer.html": "Grant writer — AI assistant",
    "/work/employee-training.html": "Employee training — impact"
  };

  function friendlyPageLabel(path) {
    if (!path) return "Unknown page";
    // Ignore local file:// style paths from opening HTML on your computer
    if (path.includes("/Users/") || path.includes("\\Users\\") || path.startsWith("file:")) {
      return null;
    }
    const clean = path.split("?")[0].split("#")[0];
    if (PAGE_LABELS[clean]) return PAGE_LABELS[clean];
    if (clean.endsWith("/") && PAGE_LABELS[clean.slice(0, -1)]) return PAGE_LABELS[clean.slice(0, -1)];
    // /work/foo.html → readable fallback
    const work = clean.match(/\/work\/([^/]+?)(?:\.html)?$/);
    if (work) return `Case study: ${work[1].replace(/-/g, " ")}`;
    return clean;
  }

  function friendlyReferrerLabel(ref) {
    const raw = (ref || "direct").trim().toLowerCase() || "direct";
    if (raw === "direct") return "Direct visit (typed URL or bookmark)";
    if (raw === "internal") return "Already on your site (clicked another page)";
    if (raw.includes("linkedin")) return "LinkedIn";
    if (raw.includes("google.")) return "Google search";
    if (raw.includes("github")) return "GitHub";
    if (raw.includes("substack")) return "Substack";
    if (raw.includes("twitter") || raw.includes("x.com")) return "X / Twitter";
    return raw;
  }

  function renderRankedList(el, rows, key, labelFn) {
    if (!rows.length) {
      el.innerHTML = '<p class="empty">No data yet.</p>';
      return;
    }
    const counts = new Map();
    rows.forEach((r) => {
      const label = labelFn ? labelFn(r[key]) : r[key] || "—";
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!ranked.length) {
      el.innerHTML = '<p class="empty">No data yet.</p>';
      return;
    }
    el.innerHTML = ranked
      .map(
        ([label, n]) =>
          `<div class="list-row"><span>${escapeHtml(label)}</span><strong>${n}</strong></div>`
      )
      .join("");
  }

  async function loadContent() {
    const { data, error } = await supabase
      .from("site_content")
      .select("draft, published, published_at")
      .eq("id", "main")
      .single();
    if (error) throw error;
    fillContentForm(data.draft || data.published || {});
  }

  async function saveDraft() {
    const payload = readContentForm();
    const { error } = await supabase
      .from("site_content")
      .update({ draft: payload })
      .eq("id", "main");
    if (error) throw error;
    showToast("Draft saved");
  }

  async function publishContent() {
    const payload = readContentForm();
    const { data: projects, error: projErr } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });
    if (projErr) throw projErr;

    const published = {
      ...payload,
      projects: (projects || []).filter((p) => p.visible)
    };

    const { error } = await supabase
      .from("site_content")
      .update({
        draft: payload,
        published,
        published_at: new Date().toISOString()
      })
      .eq("id", "main");
    if (error) throw error;
    showToast("Published");
  }

  function renderProjects(rows) {
    const list = $("#project-list");
    if (!rows.length) {
      list.innerHTML = '<p class="empty">No projects found. Re-run schema seed if needed.</p>';
      return;
    }
    list.innerHTML = rows
      .map(
        (p) => `
      <article class="project-card" data-id="${p.id}">
        <img src="${escapeAttr(resolveAsset(p.thumbnail_url))}" alt="">
        <div>
          <h4>${escapeHtml(p.title)}</h4>
          <div class="meta">${escapeHtml(p.tag)} · order ${p.sort_order}</div>
          <span class="badge ${p.visible ? "" : "off"}">${p.visible ? "Visible" : "Hidden"}</span>
        </div>
        <div class="actions">
          <button type="button" class="btn btn-ghost" data-edit-project="${p.id}">Edit</button>
        </div>
      </article>`
      )
      .join("");

    $("#stat-projects").textContent = String(rows.filter((r) => r.visible).length);
  }

  function resolveAsset(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `../${url.replace(/^\//, "")}`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    renderProjects(data || []);
    return data || [];
  }

  function openProjectEditor(project) {
    $("#project-editor").classList.remove("hidden");
    $("#project-editor-title").textContent = `Edit: ${project.slug}`;
    $("#project-id").value = project.id;
    $("#project-title").value = project.title || "";
    $("#project-tag").value = project.tag || "";
    $("#project-href").value = project.href || "";
    $("#project-thumb").value = project.thumbnail_url || "";
    $("#project-order").value = project.sort_order ?? 0;
    $("#project-visible").value = project.visible ? "true" : "false";
    $("#project-editor").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveProject() {
    const id = $("#project-id").value;
    const payload = {
      title: $("#project-title").value.trim(),
      tag: $("#project-tag").value.trim(),
      href: $("#project-href").value.trim(),
      thumbnail_url: $("#project-thumb").value.trim(),
      sort_order: Number($("#project-order").value) || 0,
      visible: $("#project-visible").value === "true"
    };
    const { error } = await supabase.from("projects").update(payload).eq("id", id);
    if (error) throw error;
    $("#project-editor").classList.add("hidden");
    await loadProjects();
    showToast("Project saved");
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "main")
      .maybeSingle();
    if (error) throw error;
    settings = data || { site_url: "", clarity_url: "", clarity_project_id: "" };
    $("#settings-site-url").value = settings.site_url || "";
    $("#settings-clarity").value = settings.clarity_url || "";
    $("#settings-clarity-id").value = settings.clarity_project_id || "";
    updateClarityLinks();
  }

  async function saveSettings() {
    const payload = {
      site_url: $("#settings-site-url").value.trim(),
      clarity_url: $("#settings-clarity").value.trim(),
      clarity_project_id: $("#settings-clarity-id").value.trim()
    };
    const { error } = await supabase
      .from("site_settings")
      .upsert({ id: "main", ...payload });
    if (error) throw error;
    settings = { id: "main", ...payload };
    updateClarityLinks();
    showToast("Settings saved");
  }

  async function changePassword() {
    const password = $("#new-password").value;
    if (!password || password.length < 8) {
      showToast("Use at least 8 characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    $("#new-password").value = "";
    showToast("Password updated");
  }

  function startOfDayISO() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  function daysAgoISO(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }

  function countUnique(rows) {
    return new Set(rows.map((r) => r.visitor_id).filter(Boolean)).size || rows.length;
  }

  async function loadAnalytics() {
    const since30 = daysAgoISO(30);
    const since7Iso = daysAgoISO(7);

    const [pvRes, evRes] = await Promise.all([
      supabase
        .from("pageviews")
        .select("path, referrer, visitor_id, device, created_at")
        .gte("created_at", since30),
      supabase
        .from("events")
        .select("name, path, label, visitor_id, meta, created_at")
        .gte("created_at", since7Iso)
    ]);

    if (pvRes.error) {
      $("#stat-visitors-7").textContent = "0";
      $("#stat-visitors-30").textContent = "0";
      $("#stat-views-today").textContent = "0";
      $("#an-views-7").textContent = "0";
      $("#an-unique-7").textContent = "0";
      $("#an-mobile").textContent = "—";
      $("#an-desktop").textContent = "—";
    } else {
      const rows = pvRes.data || [];
      const since7 = new Date(since7Iso).getTime();
      const today = new Date(startOfDayISO()).getTime();
      const last7 = rows.filter((r) => new Date(r.created_at).getTime() >= since7);
      const todayRows = rows.filter((r) => new Date(r.created_at).getTime() >= today);

      $("#stat-visitors-7").textContent = String(countUnique(last7));
      $("#stat-visitors-30").textContent = String(countUnique(rows));
      $("#stat-views-today").textContent = String(todayRows.length);
      $("#an-views-7").textContent = String(last7.length);
      $("#an-unique-7").textContent = String(countUnique(last7));

      const mobile = last7.filter((r) => r.device === "mobile").length;
      const desktop = last7.filter((r) => r.device === "desktop").length;
      const denom = mobile + desktop || 1;
      $("#an-mobile").textContent = `${Math.round((mobile / denom) * 100)}%`;
      $("#an-desktop").textContent = `${Math.round((desktop / denom) * 100)}%`;

      renderRankedList($("#top-pages"), last7, "path", friendlyPageLabel);
      renderRankedList($("#top-referrers"), last7, "referrer", friendlyReferrerLabel);

      const byDay = new Map();
      last7.forEach((r) => {
        const day = r.created_at.slice(0, 10);
        byDay.set(day, (byDay.get(day) || 0) + 1);
      });
      const dayRows = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      $("#views-by-day").innerHTML = dayRows.length
        ? dayRows
            .map(([day, n]) => `<div class="list-row"><span>${day}</span><strong>${n}</strong></div>`)
            .join("")
        : '<p class="empty">No pageviews in the last 7 days yet.</p>';
    }

    const events = evRes.error ? [] : evRes.data || [];
    const countName = (n) => events.filter((e) => e.name === n).length;
    const resume = countName("resume_click");
    const email = countName("email_click");
    const project = countName("project_click");

    $("#stat-resume").textContent = String(resume);
    $("#an-resume").textContent = String(resume);
    $("#an-email").textContent = String(email);
    $("#an-project").textContent = String(project);

    const times = events
      .filter((e) => e.name === "page_time")
      .map((e) => Number(e.meta && e.meta.duration_sec))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (times.length) {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const mins = Math.floor(avg / 60);
      const secs = avg % 60;
      $("#an-avg-time").textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    } else {
      $("#an-avg-time").textContent = "—";
    }

    const eventCounts = new Map();
    events.forEach((e) => {
      if (e.name === "page_time") return;
      const key = e.label ? `${e.name} · ${e.label}` : e.name;
      eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
    });
    const rankedEvents = [...eventCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    $("#top-events").innerHTML = rankedEvents.length
      ? rankedEvents
          .map(([label, n]) => `<div class="list-row"><span>${escapeHtml(label)}</span><strong>${n}</strong></div>`)
          .join("")
      : '<p class="empty">No click events yet. Open the site and click Resume / project cards to test.</p>';
  }

  async function loadMedia() {
    const { data, error } = await supabase.storage.from("media").list("", {
      limit: 40,
      sortBy: { column: "created_at", order: "desc" }
    });
    if (error) {
      $("#media-grid").innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
      return;
    }
    mediaFiles = (data || []).filter((f) => f.name && !f.name.endsWith("/"));
    if (!mediaFiles.length) {
      $("#media-grid").innerHTML = '<p class="empty">No uploads yet.</p>';
      return;
    }
    $("#media-grid").innerHTML = mediaFiles
      .map((f) => {
        const { data: pub } = supabase.storage.from("media").getPublicUrl(f.name);
        const url = pub.publicUrl;
        return `<article class="media-item">
          <img src="${escapeAttr(url)}" alt="">
          <div class="cap"><button type="button" class="btn btn-ghost" data-copy-url="${escapeAttr(url)}" style="padding:.25rem .55rem;font-size:.75rem">Copy URL</button></div>
        </article>`;
      })
      .join("");
  }

  async function uploadMedia() {
    const input = $("#media-file");
    const file = input.files && input.files[0];
    if (!file) {
      showToast("Choose a file first");
      return;
    }
    const safe = file.name.replace(/[^\w.\-]+/g, "-").toLowerCase();
    const path = `${Date.now()}-${safe}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });
    if (error) throw error;
    input.value = "";
    await loadMedia();
    showToast("Uploaded");
  }

  async function enterApp(session) {
    $("#user-email").textContent = session.user.email || "";
    showScreen("app");
    setTab("overview");
    refreshOptOutStatus();
    try {
      await Promise.all([loadContent(), loadProjects(), loadSettings(), loadAnalytics(), loadMedia()]);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to load admin data");
    }
  }

  const OPT_OUT_KEY = "tp_analytics_off";

  function isOptedOut() {
    try {
      return localStorage.getItem(OPT_OUT_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setAnalyticsOptOut(on) {
    try {
      if (on) localStorage.setItem(OPT_OUT_KEY, "1");
      else localStorage.removeItem(OPT_OUT_KEY);
    } catch (_) {
      /* ignore */
    }
    refreshOptOutStatus();
    showToast(on ? "This browser is excluded" : "Tracking enabled again for this browser");
  }

  function refreshOptOutStatus() {
    const el = $("#optout-status");
    if (!el) return;
    el.textContent = isOptedOut()
      ? "Status: excluded — your visits on this browser are not counted."
      : "Status: tracking on — your visits on this browser are counted.";
  }

  function wireEvents() {
    $$(".nav-tab").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.tab));
    });

    $$("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.goto));
    });

    $$("#content-section-tabs .chip").forEach((chip) => {
      chip.addEventListener("click", () => setContentSection(chip.dataset.section));
    });

    $("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errBox = $("#login-error");
      errBox.classList.add("hidden");
      const email = $("#email").value.trim();
      const password = $("#password").value;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        errBox.textContent = error.message;
        errBox.classList.remove("hidden");
        return;
      }
      await enterApp(data.session);
    });

    $("#logout-btn").addEventListener("click", async () => {
      await supabase.auth.signOut();
      showScreen("login");
    });

    $("#save-draft-btn").addEventListener("click", () =>
      saveDraft().catch((err) => showToast(err.message))
    );
    $("#publish-btn").addEventListener("click", () =>
      publishContent().catch((err) => showToast(err.message))
    );
    $("#reload-projects-btn").addEventListener("click", () =>
      loadProjects().catch((err) => showToast(err.message))
    );
    $("#save-project-btn").addEventListener("click", () =>
      saveProject().catch((err) => showToast(err.message))
    );
    $("#cancel-project-btn").addEventListener("click", () => {
      $("#project-editor").classList.add("hidden");
    });
    $("#project-list").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-edit-project]");
      if (!btn) return;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", btn.dataset.editProject)
        .single();
      if (error) return showToast(error.message);
      openProjectEditor(data);
    });

    $("#upload-media-btn").addEventListener("click", () =>
      uploadMedia().catch((err) => showToast(err.message))
    );
    $("#media-grid").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy-url]");
      if (!btn) return;
      try {
        await navigator.clipboard.writeText(btn.dataset.copyUrl);
        showToast("URL copied");
      } catch {
        showToast("Copy failed");
      }
    });

    $("#save-settings-btn").addEventListener("click", () =>
      saveSettings().catch((err) => showToast(err.message))
    );
    $("#change-password-btn").addEventListener("click", () =>
      changePassword().catch((err) => showToast(err.message))
    );
    $("#optout-on-btn").addEventListener("click", () => setAnalyticsOptOut(true));
    $("#optout-off-btn").addEventListener("click", () => setAnalyticsOptOut(false));
  }

  async function boot() {
    if (!configured) {
      showScreen("setup");
      return;
    }

    supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    wireEvents();

    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await enterApp(data.session);
    } else {
      showScreen("login");
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") showScreen("login");
      if (event === "SIGNED_IN" && session && app.classList.contains("hidden")) {
        enterApp(session);
      }
    });
  }

  boot();
})();
