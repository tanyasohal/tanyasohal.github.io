(() => {
  const cfg = window.SITE_CONFIG || {};
  const configured =
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !String(cfg.supabaseUrl).includes("YOUR_SUPABASE") &&
    !String(cfg.supabaseAnonKey).includes("YOUR_SUPABASE");

  if (!configured || !window.supabase) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function assetUrl(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
    return url.replace(/^\//, "");
  }

  function setText(el, value) {
    if (el && value != null && String(value).trim() !== "") el.textContent = value;
  }

  function setHtml(el, value) {
    if (el && value != null && String(value).trim() !== "") el.innerHTML = value;
  }

  function setHref(el, value) {
    if (el && value != null && String(value).trim() !== "") el.setAttribute("href", value);
  }

  function ensureMeta(name, content) {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function applyHero(hero) {
    if (!hero) return;
    setText($(".hero-greeting"), hero.greeting);
    setHtml($(".hero-heading"), hero.headlineHtml);
    const resume = $('.hero-btn a[data-track="resume_click"]');
    setHref(resume, hero.resumeUrl);
  }

  function applyAbout(about) {
    if (!about) return;
    const box = $(".about-text");
    if (!box) return;
    setText(box.querySelector("h2"), about.title);
    const paras = about.paragraphs || [];
    const existing = [...box.querySelectorAll("p")];
    paras.forEach((text, i) => {
      if (existing[i]) existing[i].textContent = text;
      else {
        const p = document.createElement("p");
        p.textContent = text;
        box.appendChild(p);
      }
    });
    // Remove extra paragraphs if published has fewer
    for (let i = paras.length; i < existing.length; i++) existing[i].remove();

    const img = $(".about-photo-body img");
    if (img && about.photoUrl) {
      img.src = assetUrl(about.photoUrl);
      img.classList.remove("is-missing");
    }
  }

  function applyWork(work, projects) {
    if (work) {
      const section = $("#work");
      setText(section && section.querySelector(".section-title"), work.title);
      setText(section && section.querySelector(".section-sub"), work.subtitle);
    }

    const grid = $(".browser-grid");
    if (!grid || !projects || !projects.length) return;

    grid.innerHTML = projects
      .map((p) => {
        const href = p.href || `work/${p.slug}.html`;
        const slug = p.slug || "";
        const thumb = assetUrl(p.thumbnail_url || "");
        return `<a href="${escapeHtml(href)}" class="browser-card reveal" data-track="project_click" data-track-label="${escapeHtml(slug)}">
        <div class="browser-dots"><span></span><span></span><span></span></div>
        <div class="browser-preview" aria-hidden="true">
          <img src="${escapeHtml(thumb)}" alt="" loading="lazy">
        </div>
        <div class="browser-body">
          <h3>${escapeHtml(p.title)}</h3>
          <div class="browser-footer"><span class="browser-tag">${escapeHtml(p.tag || "")}</span><span class="browser-link">Read more →</span></div>
        </div>
      </a>`;
      })
      .join("");

    observeReveals(grid);
  }

  function applySkills(skills) {
    if (!skills) return;
    const section = $("#skills");
    setText(section && section.querySelector(".section-title"), skills.title);
    setText(section && section.querySelector(".section-sub"), skills.subtitle);
    const cats = skills.categories || [];
    const cards = [...document.querySelectorAll(".skill-card")];
    cats.forEach((cat, i) => {
      if (!cards[i] || !cat || !cat.name) return;
      setText(cards[i].querySelector("h3"), cat.name);
    });
  }

  function applyWriting(writing) {
    if (!writing) return;
    const section = $("#writing");
    setText(section && section.querySelector(".section-title"), writing.title);
    setText(section && section.querySelector(".section-sub"), writing.subtitle);
    const btn = section && section.querySelector(".shadow-btn");
    if (btn) {
      setHref(btn, writing.substackUrl);
      setText(btn, writing.buttonLabel || btn.textContent);
    }
  }

  function applyContact(contact) {
    if (!contact) return;
    const box = $(".contact-text");
    if (!box) return;
    setText(box.querySelector("h2"), contact.title);
    const paras = [...box.querySelectorAll("p")];
    // First p is intro; second has email link
    if (paras[0] && contact.intro) paras[0].textContent = contact.intro;
    if (contact.email) {
      const mailLinks = box.querySelectorAll('a[data-track="email_click"]');
      mailLinks.forEach((a) => {
        a.href = `mailto:${contact.email}`;
        if (a.classList.contains("contact-email")) a.textContent = contact.email;
      });
      const gmail = $('.contact-socials a[title="Gmail"]');
      if (gmail) gmail.href = `mailto:${contact.email}`;
    }
    const linkedin = $('.contact-socials a[data-track="linkedin_click"]');
    const github = $('.contact-socials a[data-track="github_click"]');
    const tableau = $('.contact-socials a[data-track="tableau_click"]');
    const heroLinkedin = $(".hero-linkedin");
    setHref(linkedin, contact.linkedinUrl);
    setHref(heroLinkedin, contact.linkedinUrl);
    setHref(github, contact.githubUrl);
    setHref(tableau, contact.tableauUrl);
  }

  function applySeo(seo) {
    if (!seo) return;
    if (seo.title) document.title = seo.title;
    ensureMeta("description", seo.description);
  }

  function observeReveals(root) {
    const nodes = root.querySelectorAll ? root.querySelectorAll(".reveal") : [];
    if (window.__portfolioRevealObs) {
      nodes.forEach((el) => window.__portfolioRevealObs.observe(el));
      return;
    }
    const obs = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    nodes.forEach((el) => obs.observe(el));
  }

  function applyPublished(published, projects) {
    if (!published || typeof published !== "object") return;
    applyHero(published.hero);
    applyAbout(published.about);
    applyWork(published.work, projects);
    applySkills(published.skills);
    applyWriting(published.writing);
    applyContact(published.contact);
    applySeo(published.seo);
  }

  async function boot() {
    try {
      const [contentRes, projectsRes] = await Promise.all([
        client.from("published_content").select("published").limit(1).maybeSingle(),
        client
          .from("projects")
          .select("slug, title, tag, thumbnail_url, href, sort_order, visible")
          .eq("visible", true)
          .order("sort_order", { ascending: true })
      ]);

      if (contentRes.error) {
        console.warn("[content]", contentRes.error.message);
        return;
      }

      const published = contentRes.data && contentRes.data.published;
      const projects = projectsRes.error ? published && published.projects : projectsRes.data;
      applyPublished(published, projects || []);
    } catch (err) {
      console.warn("[content]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
