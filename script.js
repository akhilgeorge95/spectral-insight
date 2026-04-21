/* =====================================================
   SPECTRAL INSIGHT — interactive layer
===================================================== */

/* ---------- Loader ---------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => loader.classList.add('done'), 1400);
  }
});

/* ---------- Custom cursor ---------- */
(() => {
  const dot = document.querySelector('.cursor');
  const follow = document.querySelector('.cursor-follow');
  if (!dot || !follow) return;
  if (matchMedia('(pointer: coarse)').matches) return;

  let mx = 0, my = 0, fx = 0, fy = 0;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const loop = () => {
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    fx += (mx - fx) * 0.15;
    fy += (my - fy) * 0.15;
    follow.style.transform = `translate(${fx}px, ${fy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.querySelectorAll('[data-hover], a, button, input, textarea, select').forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.classList.add('hover');
      follow.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      dot.classList.remove('hover');
      follow.classList.remove('hover');
    });
  });
})();

/* ---------- Starfield + constellation lines ---------- */
(() => {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars;
  const LINK_DIST = 140; // draw faint line between stars within this many px

  const resize = () => {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    const count = innerWidth < 700 ? 80 : 160;
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.8 + 0.2,
      v: Math.random() * 0.15 + 0.02,
      hue: Math.random() > 0.85 ? 195 : 200 + Math.random() * 40,
    }));
  };
  resize();
  window.addEventListener('resize', resize);

  const tick = () => {
    ctx.clearRect(0, 0, w, h);

    // draw stars
    for (const s of stars) {
      s.y += s.v;
      if (s.y > h) s.y = 0;
      ctx.beginPath();
      const alpha = 0.3 + s.z * 0.6;
      const isAcc = s.hue < 210;
      ctx.fillStyle = isAcc
        ? `rgba(90, 255, 209, ${alpha * 0.8})`
        : `rgba(200, 220, 255, ${alpha * 0.6})`;
      ctx.arc(s.x, s.y, s.z * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw constellation lines between near-neighbours (sparse, for ambience)
    for (let i = 0; i < stars.length; i++) {
      const a = stars[i];
      for (let j = i + 1; j < stars.length; j++) {
        const b = stars[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const t = 1 - Math.sqrt(d2) / LINK_DIST;
          ctx.strokeStyle = `rgba(53, 195, 255, ${t * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(tick);
  };
  tick();
})();

/* ---------- Constellation satellite telemetry (simulated live) ---------- */
(() => {
  const s1Alt = document.getElementById('s1Alt');
  if (!s1Alt) return;
  const s1Vel = document.getElementById('s1Vel');
  const s1Lat = document.getElementById('s1Lat');
  const s2Alt = document.getElementById('s2Alt');
  const s2Vel = document.getElementById('s2Vel');
  const s2Band = document.getElementById('s2Band');
  const s3Alt = document.getElementById('s3Alt');
  const s3Rx = document.getElementById('s3Rx');

  const bands = ['450nm','520nm','680nm','720nm','850nm','970nm','1240nm','1450nm','2200nm'];
  let i = 0;
  setInterval(() => {
    const j = (x, r = 0.3) => (x + (Math.random() * r - r/2));
    s1Alt.textContent = j(525.3).toFixed(1);
    s1Vel.textContent = j(7.62, 0.02).toFixed(3);
    s1Lat.textContent = j(47.2, 0.6).toFixed(2) + '°N';
    s2Alt.textContent = j(518.8).toFixed(1);
    s2Vel.textContent = j(7.64, 0.02).toFixed(3);
    s2Band.textContent = bands[i % bands.length];
    s3Alt.textContent = j(531.1).toFixed(1);
    s3Rx.textContent = j(84.2, 3).toFixed(1);
    i++;
  }, 1400);
})();

/* ---------- Wavelength picker readout ---------- */
(() => {
  const out = document.getElementById('wpCurrent');
  if (!out) return;
  const stops = [
    { t: 0.06, text: '450 nm · blue edge' },
    { t: 0.30, text: '680 nm · chlorophyll' },
    { t: 0.44, text: '850 nm · NIR plateau' },
    { t: 0.52, text: '970 nm · water' },
    { t: 0.72, text: '1450 nm · water · SWIR' },
    { t: 0.92, text: '2200 nm · lignin · SWIR' },
  ];
  let idx = 0;
  const DUR = 8000;
  const t0 = performance.now();
  const tick = (t) => {
    const p = ((t - t0) % DUR) / DUR;
    // approximate picker position: 0→0.06, 0.25→0.38, 0.5→0.62, 0.75→0.9
    let pos;
    if      (p < 0.25) pos = 0.06 + (0.38 - 0.06) * (p / 0.25);
    else if (p < 0.50) pos = 0.38 + (0.62 - 0.38) * ((p - 0.25) / 0.25);
    else if (p < 0.75) pos = 0.62 + (0.90 - 0.62) * ((p - 0.50) / 0.25);
    else               pos = 0.90 - (0.90 - 0.06) * ((p - 0.75) / 0.25);
    // find closest stop
    let best = 0, bestD = Infinity;
    for (let i = 0; i < stops.length; i++) {
      const d = Math.abs(stops[i].t - pos);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best !== idx) {
      idx = best;
      out.textContent = stops[best].text;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* ---------- Scroll progress ---------- */
(() => {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = (scrollY / max) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
})();

/* ---------- Nav scroll state ---------- */
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = scrollY;
    if (y > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    // hide on scroll down past hero, show on scroll up
    if (y > 600 && y > lastY) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = y;
  }, { passive: true });
})();

/* ---------- Mobile menu ---------- */
(() => {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('navMobile');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    menu.classList.toggle('open');
    const open = menu.classList.contains('open');
    const spans = btn.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(3px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-3px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => menu.classList.remove('open'));
  });
})();

/* ---------- Reveal-on-scroll ---------- */
(() => {
  const targets = document.querySelectorAll(
    '.h-big, .lead, .tech-card, .sol-card, .insight-card, .mission-visual, .steps li, .cta-form, .hero-stats, .detect-row, .team-card, .value-cell, .timeline-item, .data-card, .tech-viz, .spec-table, .faq-item'
  );
  targets.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => io.observe(el));

  // Stagger
  const stagger = (sel, delay = 80) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.style.transitionDelay = `${i * delay}ms`;
    });
  };
  stagger('.tech-card', 70);
  stagger('.sol-card', 60);
  stagger('.insight-card', 80);
  stagger('.steps li', 100);
  stagger('.detect-row', 60);
  stagger('.team-card', 80);
  stagger('.value-cell', 70);
  stagger('.timeline-item', 80);
  stagger('.faq-item', 50);
})();

/* ---------- Counter animation ---------- */
(() => {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = el => {
    const target = +el.dataset.count;
    const dur = 1600;
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + (target >= 100 ? '+' : '');
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animate(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(el => io.observe(el));
})();

/* ---------- Hero parallax ---------- */
(() => {
  const heroImg = document.querySelector('.hero-img');
  const orbit = document.querySelector('.orbit');
  if (!heroImg && !orbit) return;
  window.addEventListener('scroll', () => {
    const y = scrollY;
    if (y > innerHeight * 1.2) return;
    if (heroImg) heroImg.style.transform = `scale(1.08) translateY(${y * 0.15}px)`;
    if (orbit) orbit.style.transform = `translateY(calc(-50% + ${y * -0.08}px))`;
  }, { passive: true });
})();

/* ---------- Magnetic buttons ---------- */
(() => {
  document.querySelectorAll('.magnetic').forEach(btn => {
    const strength = 18;
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ---------- FAQ accordion ---------- */
(() => {
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
})();

/* ---------- Live telemetry (tech page) ---------- */
(() => {
  const alt = document.getElementById('liveAlt');
  const vel = document.getElementById('liveVel');
  const lat = document.getElementById('liveLat');
  const band = document.getElementById('liveBand');
  if (!alt) return;

  const bands = ['450nm', '520nm', '680nm', '720nm', '850nm', '970nm', '1240nm', '1450nm', '2200nm'];
  let i = 0;
  setInterval(() => {
    alt.textContent = (525 + Math.random() * 0.6 - 0.3).toFixed(2);
    vel.textContent = (7.62 + Math.random() * 0.02 - 0.01).toFixed(3);
    lat.textContent = (47 + Math.random() * 0.5).toFixed(2) + '°N';
    band.textContent = bands[i % bands.length];
    i++;
  }, 1200);
})();

/* ---------- Smooth anchor scroll for in-page links ---------- */
(() => {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const y = el.getBoundingClientRect().top + scrollY - 80;
      scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
