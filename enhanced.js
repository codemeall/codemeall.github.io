/* ============================================
   ENHANCED PORTFOLIO JAVASCRIPT
   Abdul Aziz - Animated Portfolio
   ============================================ */

(function () {
	'use strict';

	/* ---------- Preloader ---------- */
	const preloader = document.getElementById('preloader');
	const preloaderBar = document.getElementById('preloader-bar');
	const terminalLines = document.querySelectorAll('.terminal-line');

	let progress = 0;
	const progressInterval = setInterval(() => {
		progress += Math.random() * 15 + 5;
		if (progress > 100) progress = 100;
		if (preloaderBar) preloaderBar.style.width = progress + '%';
		if (progress >= 100) clearInterval(progressInterval);
	}, 200);

	terminalLines.forEach((line) => {
		const delay = parseInt(line.getAttribute('data-delay')) || 0;
		setTimeout(() => line.classList.add('visible'), delay);
	});

	window.addEventListener('load', () => {
		setTimeout(() => {
			if (preloaderBar) preloaderBar.style.width = '100%';
			setTimeout(() => {
				if (preloader) preloader.classList.add('loaded');
				document.body.style.overflow = '';
				initAllAnimations();
			}, 400);
		}, 1500);
	});

	document.body.style.overflow = 'hidden';

	/* ---------- Init All ---------- */
	function initAllAnimations() {
		initCustomCursor();
		initMatrixRain();
		initScrollProgress();
		initNavbar();
		initSmoothScrolling();
		initRevealAnimations();
		initTypedRole();
		initCounters();
		initTiltCards();
		initMagneticButtons();
		initRippleEffect();
		initBackToTop();
		initParallaxOrbs();
	}

	/* ---------- Custom Cursor ---------- */
	function initCustomCursor() {
		const cursor = document.getElementById('cursor');
		const follower = document.getElementById('cursor-follower');
		if (!cursor || !follower) return;

		// Only on desktop
		if (window.matchMedia('(hover: none)').matches) return;

		let mouseX = 0, mouseY = 0;
		let cursorX = 0, cursorY = 0;
		let followerX = 0, followerY = 0;

		document.addEventListener('mousemove', (e) => {
			mouseX = e.clientX;
			mouseY = e.clientY;
		});

		function animateCursor() {
			cursorX += (mouseX - cursorX) * 0.2;
			cursorY += (mouseY - cursorY) * 0.2;
			followerX += (mouseX - followerX) * 0.08;
			followerY += (mouseY - followerY) * 0.08;

			cursor.style.transform = `translate(${cursorX - 4}px, ${cursorY - 4}px)`;
			follower.style.transform = `translate(${followerX - 16}px, ${followerY - 16}px)`;
			requestAnimationFrame(animateCursor);
		}
		animateCursor();

		// Hover effects
		const interactiveElements = document.querySelectorAll('a, button, .tech-card, .list-group-item, .accordion-button');
		interactiveElements.forEach((el) => {
			el.addEventListener('mouseenter', () => {
				cursor.classList.add('hover');
				follower.classList.add('hover');
			});
			el.addEventListener('mouseleave', () => {
				cursor.classList.remove('hover');
				follower.classList.remove('hover');
			});
		});
	}

	/* ---------- Matrix Rain ---------- */
	function initMatrixRain() {
		const canvas = document.getElementById('matrix');
		if (!canvas) return;
		const ctx = canvas.getContext('2d');

		function resize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		}
		resize();
		window.addEventListener('resize', resize);

		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]<>/\\|~`.';
		const charArray = chars.split('');
		const fontSize = 16;
		const columns = Math.floor(canvas.width / fontSize);

		const drops = [];
		const speeds = [];
		for (let i = 0; i < columns; i++) {
			drops[i] = Math.random() * -100;
			speeds[i] = Math.random() * 0.5 + 0.3;
		}

		// Mouse reactivity
		let mouseXCanvas = -1000;
		let mouseYCanvas = -1000;
		document.addEventListener('mousemove', (e) => {
			mouseXCanvas = e.clientX;
			mouseYCanvas = e.clientY;
		});

		function draw() {
			ctx.fillStyle = 'rgba(10, 25, 47, 0.08)';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			for (let i = 0; i < drops.length; i++) {
				const x = i * fontSize;
				const y = drops[i] * fontSize;

				// Distance from mouse
				const dx = x - mouseXCanvas;
				const dy = y - mouseYCanvas;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const brightness = dist < 150 ? 1 : dist < 300 ? 0.6 : 0.3;

				const alpha = Math.min(1, brightness);
				ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
				ctx.font = `${fontSize}px monospace`;

				const char = charArray[Math.floor(Math.random() * charArray.length)];
				ctx.fillText(char, x, y);

				if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
					drops[i] = 0;
				}
				drops[i] += speeds[i];
			}
		}

		setInterval(draw, 40);
	}

	/* ---------- Scroll Progress ---------- */
	function initScrollProgress() {
		const bar = document.getElementById('scroll-progress');
		if (!bar) return;

		function update() {
			const scrollTop = window.pageYOffset;
			const docHeight = document.documentElement.scrollHeight - window.innerHeight;
			const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
			bar.style.width = progress + '%';
		}

		window.addEventListener('scroll', update, { passive: true });
		update();
	}

	/* ---------- Navbar ---------- */
	function initNavbar() {
		const nav = document.getElementById('main-nav');
		if (!nav) return;

		let lastScroll = 0;
		const threshold = 5;

		window.addEventListener('scroll', () => {
			const currentScroll = window.pageYOffset;

			// Glassmorphism on scroll
			if (currentScroll > 50) {
				nav.classList.add('scrolled');
			} else {
				nav.classList.remove('scrolled');
			}

			// Hide/show navbar
			if (Math.abs(currentScroll - lastScroll) < threshold) return;

			if (currentScroll > lastScroll && currentScroll > 200) {
				nav.classList.add('hidden');
			} else {
				nav.classList.remove('hidden');
			}

			lastScroll = currentScroll;
		}, { passive: true });

		// Active nav highlighting
		const sections = document.querySelectorAll('section[id]');
		const navLinks = document.querySelectorAll('.nav-link');

		function highlightNav() {
			const scrollY = window.pageYOffset + 120;
			sections.forEach((section) => {
				const top = section.offsetTop;
				const height = section.offsetHeight;
				const id = section.getAttribute('id');
				const link = document.querySelector(`.nav-link[href="#${id}"]`);

				if (link) {
					if (scrollY >= top && scrollY < top + height) {
						link.classList.add('active');
					} else {
						link.classList.remove('active');
					}
				}
			});
		}

		window.addEventListener('scroll', highlightNav, { passive: true });
		highlightNav();
	}

	/* ---------- Smooth Scrolling ---------- */
	function initSmoothScrolling() {
		document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
			anchor.addEventListener('click', function (e) {
				e.preventDefault();
				const target = document.querySelector(this.getAttribute('href'));
				if (target) {
					target.scrollIntoView({ behavior: 'smooth' });

					// Close mobile menu
					const collapse = document.querySelector('.navbar-collapse');
					if (collapse && collapse.classList.contains('show')) {
						const toggler = document.querySelector('.navbar-toggler');
						if (toggler) toggler.click();
					}
				}
			});
		});

		// Brand click => top
		const brand = document.querySelector('.navbar-brand');
		if (brand) {
			brand.addEventListener('click', (e) => {
				e.preventDefault();
				window.scrollTo({ top: 0, behavior: 'smooth' });
			});
		}
	}

	/* ---------- Reveal on Scroll ---------- */
	function initRevealAnimations() {
		const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale');

		// Use GSAP ScrollTrigger if available, otherwise IntersectionObserver
		if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
			gsap.registerPlugin(ScrollTrigger);

			revealElements.forEach((el) => {
				const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay')) || 0;

				ScrollTrigger.create({
					trigger: el,
					start: 'top 90%',
					once: true,
					onEnter: () => {
						setTimeout(() => el.classList.add('revealed'), delay * 1000);
					}
				});
			});
		} else {
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const delay = parseFloat(getComputedStyle(entry.target).getPropertyValue('--delay')) || 0;
						setTimeout(() => entry.target.classList.add('revealed'), delay * 1000);
						observer.unobserve(entry.target);
					}
				});
			}, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

			revealElements.forEach((el) => observer.observe(el));
		}
	}

	/* ---------- Typewriter Role ---------- */
	function initTypedRole() {
		const el = document.getElementById('typed-role');
		if (!el) return;

		const strings = [
			'Lead Software Engineer',
			'Full Stack Developer',
			'Mobile Development Specialist',
			'React Native Expert',
			'Flutter Developer',
			'iOS & Android Developer',
			'SDK Architect'
		];

		let stringIndex = 0;
		let charIndex = 0;
		let isDeleting = false;
		let currentText = '';

		function type() {
			const current = strings[stringIndex];

			if (isDeleting) {
				currentText = current.substring(0, charIndex - 1);
				charIndex--;
			} else {
				currentText = current.substring(0, charIndex + 1);
				charIndex++;
			}

			el.innerHTML = '<i>' + currentText + '</i><span class="typed-cursor">|</span>';

			let speed = isDeleting ? 40 : 80;

			if (!isDeleting && charIndex === current.length) {
				speed = 2000; // Pause at end
				isDeleting = true;
			} else if (isDeleting && charIndex === 0) {
				isDeleting = false;
				stringIndex = (stringIndex + 1) % strings.length;
				speed = 400;
			}

			setTimeout(type, speed);
		}

		setTimeout(type, 800);
	}

	/* ---------- Animated Counters ---------- */
	function initCounters() {
		const counters = document.querySelectorAll('.counter');
		if (!counters.length) return;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const counter = entry.target;
					const target = parseInt(counter.getAttribute('data-target'));
					const duration = 2000;
					const start = performance.now();

					function update(now) {
						const elapsed = now - start;
						const progress = Math.min(elapsed / duration, 1);
						// Ease out cubic
						const eased = 1 - Math.pow(1 - progress, 3);
						counter.textContent = Math.floor(eased * target);

						if (progress < 1) {
							requestAnimationFrame(update);
						} else {
							counter.textContent = target;
						}
					}

					requestAnimationFrame(update);
					observer.unobserve(counter);
				}
			});
		}, { threshold: 0.5 });

		counters.forEach((c) => observer.observe(c));
	}

	/* ---------- 3D Tilt Cards ---------- */
	function initTiltCards() {
		const cards = document.querySelectorAll('.tilt-card');
		if (!cards.length) return;

		// Only on desktop
		if (window.matchMedia('(hover: none)').matches) return;

		cards.forEach((card) => {
			card.addEventListener('mousemove', (e) => {
				const rect = card.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				const centerX = rect.width / 2;
				const centerY = rect.height / 2;

				const rotateX = ((y - centerY) / centerY) * -5;
				const rotateY = ((x - centerX) / centerX) * 5;

				card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
			});

			card.addEventListener('mouseleave', () => {
				card.style.transform = '';
			});
		});
	}

	/* ---------- Magnetic Buttons ---------- */
	function initMagneticButtons() {
		const buttons = document.querySelectorAll('.magnetic-btn');
		if (!buttons.length) return;

		if (window.matchMedia('(hover: none)').matches) return;

		buttons.forEach((btn) => {
			btn.addEventListener('mousemove', (e) => {
				const rect = btn.getBoundingClientRect();
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;

				btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
			});

			btn.addEventListener('mouseleave', () => {
				btn.style.transform = '';
			});
		});
	}

	/* ---------- Ripple Effect ---------- */
	function initRippleEffect() {
		document.querySelectorAll('.ripple-btn').forEach((btn) => {
			btn.addEventListener('click', function (e) {
				const rect = this.getBoundingClientRect();
				const ripple = document.createElement('span');
				ripple.classList.add('ripple');
				const size = Math.max(rect.width, rect.height);
				ripple.style.width = ripple.style.height = size + 'px';
				ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
				ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
				this.appendChild(ripple);
				setTimeout(() => ripple.remove(), 600);
			});
		});
	}

	/* ---------- Back to Top ---------- */
	function initBackToTop() {
		const btn = document.getElementById('back-to-top');
		if (!btn) return;

		window.addEventListener('scroll', () => {
			if (window.pageYOffset > 400) {
				btn.classList.add('visible');
			} else {
				btn.classList.remove('visible');
			}
		}, { passive: true });

		btn.addEventListener('click', () => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}

	/* ---------- Parallax Orbs ---------- */
	function initParallaxOrbs() {
		const orbs = document.querySelectorAll('.orb');
		if (!orbs.length) return;

		if (window.matchMedia('(hover: none)').matches) return;

		document.addEventListener('mousemove', (e) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 2;
			const y = (e.clientY / window.innerHeight - 0.5) * 2;

			orbs.forEach((orb, i) => {
				const speed = (i + 1) * 10;
				orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
			});
		});
	}

})();
