(function () {
  "use strict";

  // Optional: Server-Log "common.js executed"
  // (nur wenn du den Flask-Endpoint wirklich hast)
  try {
    fetch("/__common_ping?ts=" + Date.now(), { cache: "no-store" }).catch(() => {});
  } catch (e) {}

  // ---------- CSS (nur einmal) ----------
  try {
    if (!document.getElementById("commonYTcss")) {
      const st = document.createElement("style");
      st.id = "commonYTcss";
      st.textContent = `
        .ytFrameWrap{
          position:relative;
          border-radius:18px;
          overflow:hidden;
          background:rgba(0,0,0,.35);
          border:1px solid rgba(255,255,255,.18);
          box-shadow:0 18px 40px rgba(0,0,0,.45);
        }
        .ytFrameWrap::after{
          content:"";
          position:absolute;
          inset:0;
          pointer-events:none;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.10);
        }
        .ytFrameWrap iframe{
          display:block;
          width:100%;
          height:100%;
          border:0;
        }
        /* dezenter Glow außen (sieht aus wie “weicher Rand”) */
        .ytGlow{
          position:absolute;
          inset:-30px;
          z-index:0;
          pointer-events:none;
          filter:blur(16px);
          opacity:.25;
          transform:scale(1.05);
        }
        .ytInner{
          position:relative;
          z-index:1;
        }
        .ytOpenBtn{
          position:absolute;
          left:12px;
          bottom:12px;
          z-index:5;
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:8px 12px;
          border-radius:999px;
          background:rgba(0,0,0,.65);
          color:#ffe600;
          font-weight:900;
          font-size:12px;
          text-decoration:none;
          border:1px solid rgba(255,255,255,.18);
          backdrop-filter:blur(6px);
        }
        .ytOpenBtn:hover{ transform:translateY(-1px); }
        .ytOpenBtn:active{ transform:translateY(0); }
      `;
      document.head.appendChild(st);
    }
  } catch (e) {}

  function isYouTubeIframe(el) {
    if (!el || el.tagName !== "IFRAME") return false;
    const src = (el.getAttribute("src") || "").toLowerCase();
    return src.includes("youtube.com") || src.includes("youtube-nocookie.com") || src.includes("youtu.be");
  }

  function extractVideoId(src) {
    try {
      const u = new URL(src, location.href);

      // /embed/VIDEOID
      if (u.pathname.includes("/embed/")) {
        return u.pathname.split("/embed/")[1].split("/")[0] || "";
      }

      // watch?v=VIDEOID
      const v = u.searchParams.get("v");
      if (v) return v;

      // youtu.be/VIDEOID
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.replace("/", "") || "";
      }
    } catch (e) {}
    return "";
  }

  function toWatchUrl(src) {
    const id = extractVideoId(src);
    return id ? `https://www.youtube.com/watch?v=${id}` : src;
  }

  function ensureWrapped(iframe) {
    if (iframe.closest(".ytFrameWrap")) return iframe.closest(".ytFrameWrap");

    const wrap = document.createElement("div");
    wrap.className = "ytFrameWrap";

    // Glow-Layer (nimmt das Poster/Video als Background, weicher Rand)
    const glow = document.createElement("div");
    glow.className = "ytGlow";

    // Inner Layer
    const inner = document.createElement("div");
    inner.className = "ytInner";

    // iframe umziehen
    const parent = iframe.parentNode;
    parent.insertBefore(wrap, iframe);
    parent.removeChild(iframe);

    inner.appendChild(iframe);
    wrap.appendChild(glow);
    wrap.appendChild(inner);

    // Background für Glow versuchen zu setzen (aus iframe-src -> kein echtes Thumbnail möglich ohne API,
    // daher nehmen wir einfach einen neutralen Verlauf)
    glow.style.background = "radial-gradient(circle at 50% 40%, rgba(255,230,0,.25), rgba(0,0,0,0) 60%)";

    return wrap;
  }

  function ensureOpenButton(wrap, iframe) {
    if (wrap.querySelector(".ytOpenBtn")) return;

    const a = document.createElement("a");
    a.className = "ytOpenBtn";
    a.href = toWatchUrl(iframe.getAttribute("src") || "");
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "▶ Open on YouTube";
    wrap.appendChild(a);
  }

  function decorate(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("iframe").forEach((ifr) => {
      if (!isYouTubeIframe(ifr)) return;

      const wrap = ensureWrapped(ifr);
      ensureOpenButton(wrap, ifr);
    });
  }

  // 1) einmal beim Start
  decorate(document);

  // 2) und dann auch für “später erzeugte” Modals/Subpages
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        // wenn irgendwo neue IFAMES reinkommen → dekorieren
        if (node.tagName === "IFRAME") {
          decorate(node.parentElement || document);
        } else {
          decorate(node);
        }
      }
    }
  });

  try {
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}

  // optional fürs Debuggen
  window.__decorateYT = decorate;
})();
