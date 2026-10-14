/* ==========================================================
   Abdul Aziz — Portfolio interactions
   No dependencies. Everything degrades to static content.
   ========================================================== */

(function () {
	'use strict';

	var doc = document.documentElement;
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	var desktop = window.matchMedia('(min-width: 901px)');

	function $(sel, root) { return (root || document).querySelector(sel); }
	function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
	function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

	/* ---------- Intro ---------- */
	requestAnimationFrame(function () {
		requestAnimationFrame(function () { doc.classList.add('is-loaded'); });
	});

	/* ---------- Footer year ---------- */
	$$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

	/* ---------- Toast + copy email ---------- */
	var toast = $('#toast');
	var toastTimer;
	function showToast(msg) {
		if (!toast) return;
		toast.textContent = msg;
		toast.classList.add('is-on');
		clearTimeout(toastTimer);
		toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
	}
	$$('[data-copy]').forEach(function (btn) {
		btn.addEventListener('click', function () {
			var text = btn.getAttribute('data-copy');
			var done = function () { showToast('Email copied to clipboard'); };
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(done, function () { window.location.href = 'mailto:' + text; });
			} else {
				window.location.href = 'mailto:' + text;
			}
		});
	});

	/* ---------- Navigation ---------- */
	var nav = $('#nav');
	var navToggle = $('#nav-toggle');
	var navLinks = $('#nav-links');
	function setMenu(open) {
		navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
		navLinks.classList.toggle('is-open', open);
		nav.classList.toggle('menu-open', open);
	}
	if (navToggle && navLinks) {
		navToggle.addEventListener('click', function () { setMenu(navToggle.getAttribute('aria-expanded') !== 'true'); });
		$$('a', navLinks).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
		document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
	}

	// Active section highlight
	var navMap = {};
	$$('a[href^="#"]', navLinks).forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
	if ('IntersectionObserver' in window) {
		var secObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (en.isIntersecting && navMap[en.target.id]) {
					Object.keys(navMap).forEach(function (k) { navMap[k].classList.remove('is-active'); });
					navMap[en.target.id].classList.add('is-active');
				}
			});
		}, { rootMargin: '-45% 0px -50% 0px' });
		Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) secObserver.observe(s); });
	}

	/* ---------- Reveal on scroll + counters ---------- */
	function countUp(el) {
		var target = parseInt(el.getAttribute('data-count'), 10) || 0;
		if (reduceMotion) { el.textContent = target; return; }
		var start = performance.now(), dur = 1600;
		(function tick(now) {
			var p = clamp((now - start) / dur, 0, 1);
			el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
			if (p < 1) requestAnimationFrame(tick);
		})(start);
	}
	if ('IntersectionObserver' in window && !reduceMotion) {
		var revealObs = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (!en.isIntersecting) return;
				en.target.classList.add('is-in');
				$$('[data-count]', en.target).forEach(countUp);
				revealObs.unobserve(en.target);
			});
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
		$$('.reveal').forEach(function (el) { revealObs.observe(el); });
	} else {
		$$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
		$$('[data-count]').forEach(countUp);
	}

	/* ---------- Hero rotator ---------- */
	var rotator = $('#rotator');
	if (rotator && !reduceMotion) {
		var items = $$('span', rotator), idx = 0;
		setInterval(function () {
			var cur = items[idx];
			idx = (idx + 1) % items.length;
			cur.classList.remove('is-active');
			cur.classList.add('is-out');
			setTimeout(function () { cur.classList.remove('is-out'); }, 650);
			items[idx].classList.add('is-active');
		}, 2800);
	}

	/* ---------- Hero console ---------- */
	var consoleBody = $('#console-body');
	if (consoleBody) {
		var script = [
			{ t: 'cmd', text: 'aziz ship --project mvp --team hybrid' },
			{ t: 'dim', text: '→ spinning up lead + 6 agents…' },
			{ t: 'ok', agent: 'architect', text: 'system design approved by lead' },
			{ t: 'ok', agent: 'builders×3', text: 'iOS · Android · API in parallel' },
			{ t: 'ok', agent: 'qa', text: '186 tests passing' },
			{ t: 'ok', agent: 'reviewer', text: '0 blocking issues' },
			{ t: 'ok', agent: 'lead', text: 'reviewed & merged ✔' },
			{ t: 'ok', agent: 'release', text: 'App Store · Play · Web' }
		];
		var esc = function (s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
		var render = function (line, partial) {
			if (line.t === 'cmd') return '<span class="c-prompt">$</span> <span class="c-cmd">' + esc(partial) + '</span>';
			if (line.t === 'dim') return '<span class="c-dim">' + esc(partial) + '</span>';
			return '<span class="c-ok">✓</span> <span class="c-agent">' + esc(line.agent) + '</span> ' + esc(partial);
		};
		if (reduceMotion) {
			consoleBody.innerHTML = script.map(function (l) { return '<div class="ln">' + render(l, l.text) + '</div>'; }).join('');
		} else {
			var runConsole = function () {
				consoleBody.innerHTML = '';
				var li = 0;
				var nextLine = function () {
					if (li >= script.length) {
						var c = document.createElement('div');
						c.className = 'ln';
						c.innerHTML = '<span class="c-prompt">$</span> <span class="caret"></span>';
						consoleBody.appendChild(c);
						setTimeout(runConsole, 4200);
						return;
					}
					var line = script[li++];
					var el = document.createElement('div');
					el.className = 'ln';
					consoleBody.appendChild(el);
					if (line.t === 'cmd') {
						var ci = 0;
						(function type() {
							ci++;
							el.innerHTML = render(line, line.text.slice(0, ci)) + '<span class="caret"></span>';
							if (ci < line.text.length) setTimeout(type, 34 + Math.random() * 40);
							else { el.innerHTML = render(line, line.text); setTimeout(nextLine, 420); }
						})();
					} else {
						el.innerHTML = render(line, line.text);
						el.animate && el.animate([{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
						setTimeout(nextLine, 380 + Math.random() * 260);
					}
				};
				nextLine();
			};
			setTimeout(runConsole, 900);
		}
	}

	/* ---------- Hero particle network ---------- */
	var canvas = $('#hero-canvas');
	if (canvas && canvas.getContext && !reduceMotion) {
		var ctx = canvas.getContext('2d');
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		var W = 0, H = 0, pts = [], mouse = { x: -9999, y: -9999 }, heroVisible = true;
		var resize = function () {
			var r = canvas.getBoundingClientRect();
			W = r.width; H = r.height;
			canvas.width = W * dpr; canvas.height = H * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			var n = Math.round(clamp(W * H / 14000, 30, 110));
			pts = [];
			for (var i = 0; i < n; i++) {
				pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.4 + .4, hue: Math.random() < .7 ? 0 : 1 });
			}
		};
		resize();
		window.addEventListener('resize', resize);
		canvas.parentElement.addEventListener('pointermove', function (e) {
			var r = canvas.getBoundingClientRect();
			mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
		});
		canvas.parentElement.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }).observe(canvas);
		}
		var LINK = 130;
		(function frame() {
			requestAnimationFrame(frame);
			if (!heroVisible) return;
			ctx.clearRect(0, 0, W, H);
			for (var i = 0; i < pts.length; i++) {
				var p = pts[i];
				var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
				if (d2 < 40000) { p.vx += dx * .00004; p.vy += dy * .00004; }
				p.vx *= .995; p.vy *= .995;
				p.x += p.vx; p.y += p.vy;
				if (p.x < 0 || p.x > W) p.vx *= -1;
				if (p.y < 0 || p.y > H) p.vy *= -1;
				for (var j = i + 1; j < pts.length; j++) {
					var q = pts[j], ex = p.x - q.x, ey = p.y - q.y, d = Math.sqrt(ex * ex + ey * ey);
					if (d < LINK) {
						ctx.strokeStyle = 'rgba(252,238,10,' + (1 - d / LINK) * .14 + ')';
						ctx.lineWidth = 1;
						ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
					}
				}
				if (d2 < 32000) {
					ctx.strokeStyle = 'rgba(0,240,255,' + (1 - d2 / 32000) * .5 + ')';
					ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
				}
				ctx.fillStyle = p.hue ? 'rgba(0,240,255,.8)' : 'rgba(252,238,10,.75)';
				ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
			}
		})();
	}

	/* ---------- Manifesto: split words ---------- */
	var manifesto = $('[data-scrub-words]');
	var words = [];
	if (manifesto) {
		(function split(node) {
			Array.prototype.slice.call(node.childNodes).forEach(function (child) {
				if (child.nodeType === 3) {
					var frag = document.createDocumentFragment();
					child.textContent.split(/(\s+)/).forEach(function (part) {
						if (!part) return;
						if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
						var s = document.createElement('span');
						s.className = 'w'; s.textContent = part;
						frag.appendChild(s);
					});
					child.parentNode.replaceChild(frag, child);
				} else if (child.nodeType === 1) {
					split(child);
				}
			});
		})(manifesto);
		words = $$('.w', manifesto);
	}

	/* ---------- Ownership stack ---------- */
	var ownership = $('#ownership');
	var layerItems = $$('#layer-list li');
	var plates = $$('#stack-3d .plate').reverse(); // index 0 = bottom (Architecture)
	var stack3d = $('#stack-3d');
	var meter = $('#stack-meter-fill');
	var activeLayer = -1;
	function setLayer(i) {
		if (i === activeLayer) return;
		activeLayer = i;
		layerItems.forEach(function (li, k) { li.classList.toggle('is-active', k === i); });
		plates.forEach(function (pl, k) {
			pl.classList.toggle('is-active', k === i);
			pl.classList.toggle('is-done', k < i);
		});
	}

	/* ---------- Timeline ---------- */
	var timeline = $('#timeline');

	/* ---------- Scroll loop ---------- */
	var progressBar = $('.scroll-progress span');
	var lastY = window.scrollY, ticking = false;

	function sectionProgress(el) {
		var r = el.getBoundingClientRect();
		var total = r.height - window.innerHeight;
		return total > 0 ? clamp(-r.top / total, 0, 1) : (r.top < 0 ? 1 : 0);
	}

	function onScroll() {
		ticking = false;
		var y = window.scrollY;
		var max = doc.scrollHeight - window.innerHeight;
		if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';

		if (nav) {
			nav.classList.toggle('is-scrolled', y > 20);
			var menuOpen = navLinks && navLinks.classList.contains('is-open');
			nav.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 600);
		}
		lastY = y;

		if (reduceMotion) return;

		if (manifesto && words.length) {
			var mp = sectionProgress(manifesto.closest('.manifesto'));
			var lit = Math.round(clamp((mp - .05) / .8, 0, 1) * words.length);
			for (var i = 0; i < words.length; i++) words[i].classList.toggle('is-lit', i < lit);
		}

		if (ownership && desktop.matches) {
			var op = sectionProgress(ownership);
			var n = layerItems.length;
			setLayer(Math.min(n - 1, Math.floor(op * n)));
			if (stack3d) stack3d.style.setProperty('--gap', (14 + op * 34).toFixed(1) + 'px');
			if (meter) meter.style.height = (op * 100) + '%';
		}

		if (timeline) {
			var tr = timeline.getBoundingClientRect();
			var tp = clamp((window.innerHeight * .7 - tr.top) / tr.height, 0, 1);
			timeline.style.setProperty('--tl', tp.toFixed(3));
		}
	}
	window.addEventListener('scroll', function () {
		if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
	}, { passive: true });
	window.addEventListener('resize', onScroll);
	onScroll();
	if (reduceMotion && timeline) timeline.style.setProperty('--tl', 1);

	/* ---------- Orbit links ---------- */
	var orbitLinks = $('.orbit-links');
	if (orbitLinks) {
		var NS = 'http://www.w3.org/2000/svg';
		$$('.agent').forEach(function (agent) {
			var a = parseFloat(getComputedStyle(agent).getPropertyValue('--a')) * Math.PI / 180;
			var x = 300 + Math.cos(a) * 222, y = 300 + Math.sin(a) * 222;
			var line = document.createElementNS(NS, 'line');
			line.setAttribute('x1', 300); line.setAttribute('y1', 300);
			line.setAttribute('x2', x.toFixed(1)); line.setAttribute('y2', y.toFixed(1));
			orbitLinks.appendChild(line);
			var dot = document.createElementNS(NS, 'circle');
			dot.setAttribute('cx', (300 + Math.cos(a) * 130).toFixed(1));
			dot.setAttribute('cy', (300 + Math.sin(a) * 130).toFixed(1));
			dot.setAttribute('r', 3);
			orbitLinks.appendChild(dot);
		});
	}

	/* ---------- Services filter ---------- */
	var filter = $('.filter');
	if (filter) {
		var thumb = $('.filter-thumb', filter);
		var fbtns = $$('button', filter);
		var tiles = $$('#bento .tile');
		var moveThumb = function (btn) {
			if (!thumb) return;
			thumb.style.width = btn.offsetWidth + 'px';
			thumb.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
		};
		var applyFilter = function (btn) {
			var cat = btn.getAttribute('data-filter');
			fbtns.forEach(function (b) { b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
			tiles.forEach(function (t) {
				var cats = (t.getAttribute('data-cat') || '').split(' ');
				t.classList.toggle('is-dim', cat !== 'all' && cats.indexOf(cat) === -1);
			});
			moveThumb(btn);
		};
		fbtns.forEach(function (b) { b.addEventListener('click', function () { applyFilter(b); }); });
		var initThumb = function () { moveThumb($('[aria-selected="true"]', filter) || fbtns[0]); };
		window.addEventListener('resize', initThumb);
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(initThumb);
		initThumb();
	}

	/* ---------- Who tabs ---------- */
	var tabs = $$('.who-tabs [role="tab"]');
	function selectTab(tab, focus) {
		tabs.forEach(function (t) {
			var on = t === tab;
			t.setAttribute('aria-selected', on ? 'true' : 'false');
			t.tabIndex = on ? 0 : -1;
			var panel = document.getElementById(t.getAttribute('aria-controls'));
			if (panel) { panel.hidden = !on; panel.classList.toggle('is-active', on); }
		});
		if (focus) tab.focus();
	}
	tabs.forEach(function (tab, i) {
		tab.addEventListener('click', function () { selectTab(tab); });
		tab.addEventListener('keydown', function (e) {
			var k = e.key, next = null;
			if (k === 'ArrowDown' || k === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
			if (k === 'ArrowUp' || k === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
			if (k === 'Home') next = tabs[0];
			if (k === 'End') next = tabs[tabs.length - 1];
			if (next) { e.preventDefault(); selectTab(next, true); }
		});
	});

	/* ---------- Marquees ---------- */
	$$('.marquee').forEach(function (m) {
		var track = $('.marquee-track', m);
		if (!track) return;
		m.style.setProperty('--speed', (parseFloat(m.getAttribute('data-speed')) || 40) + 's');
		$$('.chip', track).forEach(function (c) {
			var clone = c.cloneNode(true);
			clone.setAttribute('aria-hidden', 'true');
			track.appendChild(clone);
		});
	});

	/* ---------- Pointer effects (desktop only) ---------- */
	if (!finePointer || reduceMotion) return;

	// Spotlight cards
	document.addEventListener('pointermove', function (e) {
		var card = e.target.closest && e.target.closest('.spotlight');
		if (!card) return;
		var r = card.getBoundingClientRect();
		card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
		card.style.setProperty('--my', (e.clientY - r.top) + 'px');
	}, { passive: true });

	// Magnetic buttons
	$$('.magnetic').forEach(function (el) {
		el.addEventListener('pointermove', function (e) {
			var r = el.getBoundingClientRect();
			var x = (e.clientX - r.left - r.width / 2) * .25;
			var y = (e.clientY - r.top - r.height / 2) * .35;
			el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
		});
		el.addEventListener('pointerleave', function () { el.style.transform = ''; });
	});

	// Console tilt
	$$('[data-tilt]').forEach(function (el) {
		var host = el.parentElement;
		host.addEventListener('pointermove', function (e) {
			var r = host.getBoundingClientRect();
			var px = (e.clientX - r.left) / r.width - .5;
			var py = (e.clientY - r.top) / r.height - .5;
			el.style.transform = 'rotateY(' + (px * 10) + 'deg) rotateX(' + (-py * 8) + 'deg)';
		});
		host.addEventListener('pointerleave', function () { el.style.transform = ''; });
	});

	// Custom cursor
	var cursor = $('.cursor');
	if (cursor) {
		doc.classList.add('has-cursor');
		var dot = $('.cursor-dot', cursor), ring = $('.cursor-ring', cursor);
		var cx = -100, cy = -100, rx = -100, ry = -100;
		document.addEventListener('pointermove', function (e) {
			cx = e.clientX; cy = e.clientY;
			dot.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
			var hit = e.target.closest && e.target.closest('a, button, [role="tab"], .agent');
			cursor.classList.toggle('is-hover', !!hit);
		}, { passive: true });
		document.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
		document.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
		document.addEventListener('pointerleave', function () { cx = cy = -100; });
		(function follow() {
			rx += (cx - rx) * .18; ry += (cy - ry) * .18;
			ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
			requestAnimationFrame(follow);
		})();
	}
})();
