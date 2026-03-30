"use client";

import { useRef, useState, useEffect } from 'react';
import './page.css';

export default function Home() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [targetText, setTargetText] = useState("SYSTEM BOOT");

  useEffect(() => {
    if (focusMode) document.body.classList.add('focus-mode-active');
    else document.body.classList.remove('focus-mode-active');
  }, [focusMode]);

  const updateBeamAngle = (clientX, clientY) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.55;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    document.body.style.setProperty('--beam-angle', angle);
  };

  useEffect(() => {
    let mouseTick = false;
    const handleGlobalMouseMove = (e) => {
      if (document.body.classList.contains('focus-mode-active')) {
        if (!mouseTick) {
          window.requestAnimationFrame(() => {
            updateBeamAngle(e.clientX, e.clientY);
            mouseTick = false;
          });
          mouseTick = true;
        }
      }
    };
    document.addEventListener("mousemove", handleGlobalMouseMove);
    return () => document.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  const toggleFocusMode = (e) => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    if (newFocusMode) {
      updateBeamAngle(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    containerRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
    containerRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  // Text Scrambling Logic
  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
    const target = "SYSTEM ONLINE";
    let interval;

    if (!isLoaded) {
      interval = setInterval(() => {
        let str = "";
        for (let i = 0; i < target.length; i++) {
          str += target[i] === " " ? " " : chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setTargetText(str);
      }, 50);
    } else {
      setTargetText(target);
    }

    return () => clearInterval(interval);
  }, [isLoaded]);

  // Spline load handler
  const handleSplineLoad = () => {
    setTimeout(() => {
      setIsLoaded(true);
      document.body.classList.add('ready');
    }, 800);
  };

  // Fallback loader if spline fails
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!isLoaded) {
        setIsLoaded(true);
        document.body.classList.add('ready');
      }
    }, 4000);
    return () => clearTimeout(fallback);
  }, [isLoaded]);

  // Logic to hide the Spline logo (Original index.html approach)
  useEffect(() => {
    const hideSplineLogo = () => {
      const viewer = viewerRef.current;
      if (viewer) {
        // 1. Shadow DOM hiding (Exact logic from your index.html)
        if (viewer.shadowRoot) {
          const logo = viewer.shadowRoot.querySelector('#logo');
          if (logo) logo.style.display = 'none';
        }

        // 2. Extra safety for dynamic injection (Scrubbing every 1s)
        const l = document.querySelector('a[href*="spline.design"]');
        if (l) l.style.display = 'none';
      }
    };

    const interval = setInterval(hideSplineLogo, 1000);

    // Add load listener to viewer
    const viewer = viewerRef.current;
    if (viewer) {
      viewer.addEventListener('load', () => {
        setIsLoaded(true);
        document.body.classList.add('ready');
        hideSplineLogo();
      });
    }

    return () => clearInterval(interval);
  }, []);

  // Optimized Cinematic Scroll Management
  useEffect(() => {
    const sections = document.querySelectorAll('.ml-section, .nn-section');
    if (!sections.length || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else {
          entry.target.classList.remove('active');
        }
      });
    }, { threshold: 0, rootMargin: '100px' });

    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Enhanced Scroll Observer for Individual Elements (Bi-directional)
  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Toggle class based on intersection for bi-directional animation
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        } else {
          entry.target.classList.remove('reveal-active');
        }
      });
    }, { 
      threshold: 0.05,
      rootMargin: '0px 0px -10% 0px' 
    });

    // Initial setup for staggered elements
    const setupStaggers = () => {
      document.querySelectorAll('.stagger-root').forEach(root => {
        const children = root.querySelectorAll('[data-reveal], .mask-reveal');
        children.forEach((child, index) => {
          child.style.setProperty('--reveal-delay', `${index * 80}ms`); // Reduced delay for snappier feel
        });
      });
    };

    setupStaggers();
    document.querySelectorAll('[data-reveal], .mask-reveal').forEach(el => revealObserver.observe(el));

    // Performance: Deep pause of Spline model when not in view
    const heroObserver = new IntersectionObserver((entries) => {
      const splineContainer = document.querySelector('.spline-container');
      if (splineContainer) {
        const isVisible = entries[0].isIntersecting;
        splineContainer.style.display = isVisible ? 'block' : 'none'; // Better than visibility: hidden
      }
    }, { threshold: 0 });

    const heroSection = document.getElementById('hero');
    if (heroSection) heroObserver.observe(heroSection);

    return () => {
      revealObserver.disconnect();
      heroObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('[data-count]').forEach(el => {
            if (el.dataset.running) return;
            el.dataset.running = 'true';
            
            const target = parseFloat(el.getAttribute('data-count'));
            const isFloat = target % 1 !== 0;
            const duration = 1500; // Snappier count
            const start = performance.now();

            function update(now) {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 4); // Quart eased
              const current = eased * target;
              el.textContent = isFloat ? current.toFixed(1) : Math.floor(current);
              if (progress < 1) {
                requestAnimationFrame(update);
              } else {
                delete el.dataset.running;
              }
            }
            requestAnimationFrame(update);
          });
        } else {
          // Reset numbers when leaving viewport for bi-directional experience
          entry.target.querySelectorAll('[data-count]').forEach(el => {
            el.textContent = '0';
            delete el.dataset.running;
          });
        }
      });
    }, { threshold: 0.1 });

    const statsEl = document.querySelector('.ml-stats');
    if (statsEl) statsObserver.observe(statsEl);
    return () => statsObserver.disconnect();
  }, []);

  // Neural Network Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const nodes = [];
    const connections = [];
    const layers = [4, 6, 8, 6, 4];

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      buildNetwork(rect.width, rect.height);
    }

    function buildNetwork(w, h) {
      nodes.length = 0;
      connections.length = 0;
      const layerSpacing = w / (layers.length + 1);
      layers.forEach((count, li) => {
        const x = layerSpacing * (li + 1);
        const nodeSpacing = h / (count + 1);
        for (let ni = 0; ni < count; ni++) {
          const y = nodeSpacing * (ni + 1);
          nodes.push({ x, y, layer: li, radius: 4 + Math.random() * 3, pulse: Math.random() * Math.PI * 2 });
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
          if (nodes[j].layer === nodes[i].layer + 1) {
            if (Math.random() > 0.3) {
              connections.push({ from: i, to: j, progress: Math.random(), speed: 0.002 + Math.random() * 0.004 });
            }
          }
        }
      }
    }

    function draw(time) {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      connections.forEach(conn => {
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        conn.progress += conn.speed;
        if (conn.progress > 1) conn.progress = 0;
        const px = from.x + (to.x - from.x) * conn.progress;
        const py = from.y + (to.y - from.y) * conn.progress;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 243, 255, ${0.6 * (1 - Math.abs(conn.progress - 0.5) * 2)})`;
        ctx.fill();
      });

      nodes.forEach(node => {
        const glow = 0.5 + 0.5 * Math.sin(time * 0.002 + node.pulse);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 243, 255, ${0.1 + glow * 0.3})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 243, 255, ${0.5 + glow * 0.5})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 4 * glow, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 243, 255, ${0.05 * glow})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    }

    const canvasObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          resize();
          if (!animId) animId = requestAnimationFrame(draw);
        } else {
          cancelAnimationFrame(animId);
          animId = null;
        }
      });
    }, { threshold: 0.1 });

    if (canvas.parentElement) {
      canvasObserver.observe(canvas.parentElement);
    }

    let resizeTimeout;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (animId) resize();
      }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      canvasObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div id="loader-wrapper" className={isLoaded ? 'hidden' : ''}>
        <div className="decryptor-container">
          <div className={`decryptor-text ${isLoaded ? 'locked' : ''}`}>{targetText}</div>
          <div className="decryptor-subtext">ESTABLISHING NEURAL LINK...</div>
        </div>
      </div>
      <main>
        <section className="hero-section" id="hero">
          <div className="spline-container">
            <spline-viewer
              ref={viewerRef}
              url="https://prod.spline.design/ytNb29B-70AARpHr/scene.splinecode"
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
              loading="lazy"
            />
          </div>

          <div className="flashlight-beam"></div>

          <button className="focus-mode-btn" onClick={toggleFocusMode}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6"></path>
              <path d="M10 22h4"></path>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path>
            </svg>
            Focus Mode
          </button>

          <div className="ui-layer">
            <header className="minimal-header">
              <a href="#machine-learning">Machine Learning</a>
              <a href="#neural-networks">Neural Networks</a>
              <a href="#generative-ai">Generative AI</a>
              <a href="#ai-robotics">AI in Robotics</a>
              <a href="#future-of-ai">Future of AI</a>
            </header>

            <div
              className={`hero-text-container interactive-text ${isHovered ? 'is-hovered' : ''}`}
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <h1 className="minimal-heading">Experience<br />Intelligence</h1>
              <p className="minimal-subtext">Designed for the future<br />Beyond code. Beyond logic.</p>
            </div>

            <div className="system-status">
              <div className="status-dot"></div>
              <div className="status-text">
                <span className="status-label">System State</span>
                <span className="status-value">Neural Engine Online</span>
                <div className="rotating-text-wrapper">
                  <div className="rotating-text">
                    <span>Analyzing data...</span>
                    <span>Generating ideas...</span>
                    <span>Building intelligence...</span>
                    <span>Transforming the future...</span>
                    <span>Analyzing data...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ml-section" id="machine-learning">
          <div className="ml-section-bg"></div>

          <div className="ml-bg-orb orb-1"></div>
          <div className="ml-bg-orb orb-2"></div>
          <div className="ml-bg-orb orb-3"></div>

          <div className="ml-container">
            <div className="ml-header stagger-root">
              <div className="ml-badge" data-reveal="scale">
                <div className="ml-badge-dot"></div>
                Machine Learning
              </div>
              <h2 className="ml-title" data-reveal="up">Where Data Becomes <br />Intelligence</h2>
              <p className="ml-subtitle" data-reveal="up">Machine learning enables systems to learn from data, identify patterns, and make decisions with minimal human intervention — reshaping every industry on the planet.</p>
            </div>

            <div className="ml-grid stagger-root">
              <div className="ml-card" data-reveal="magnetic-up" style={{ '--card-accent': '#00f3ff', '--card-accent-bg': 'rgba(0,243,255,0.1)', '--card-accent-border': 'rgba(0,243,255,0.15)' }}>
                <div className="ml-card-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                </div>
                <h3>Supervised Learning</h3>
                <p>Algorithms learn from labeled training data to map inputs to outputs, enabling precise classification and regression tasks with remarkable accuracy.</p>
              </div>

              <div className="ml-card" data-reveal="magnetic-up" style={{ '--card-accent': '#b56cff', '--card-accent-bg': 'rgba(181,108,255,0.1)', '--card-accent-border': 'rgba(181,108,255,0.15)' }}>
                <div className="ml-card-icon">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 1v4" /><path d="M12 19v4" /><path d="M4.22 4.22l2.83 2.83" /><path d="M16.95 16.95l2.83 2.83" /><path d="M1 12h4" /><path d="M19 12h4" /><path d="M4.22 19.78l2.83-2.83" /><path d="M16.95 7.05l2.83-2.83" /></svg>
                </div>
                <h3>Unsupervised Learning</h3>
                <p>Discovers hidden structures in unlabeled data through clustering and dimensionality reduction, revealing patterns humans might never find.</p>
              </div>

              <div className="ml-card" data-reveal="magnetic-up" style={{ '--card-accent': '#ff006e', '--card-accent-bg': 'rgba(255,0,110,0.1)', '--card-accent-border': 'rgba(255,0,110,0.15)' }}>
                <div className="ml-card-icon">
                  <svg viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></svg>
                </div>
                <h3>Reinforcement Learning</h3>
                <p>Agents learn optimal strategies through trial, error, and reward signals — the same paradigm behind game-playing AIs and autonomous robotics.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="nn-section" id="neural-networks">
          <div className="ml-section-bg"></div>
          <div className="ml-bg-orb orb-1"></div>
          <div className="ml-bg-orb orb-4"></div>

          <div className="ml-visualization" data-reveal="up">
            <div className="ml-viz-content stagger-root">
              <div className="ml-viz-label" data-reveal="right">Real-time Processing</div>
              <h3 className="ml-viz-title" data-reveal="up">Neural Network<br />Architecture</h3>
              <p className="ml-viz-desc" data-reveal="up">Modern machine learning models process millions of data points through layers of interconnected neurons, each one refining the signal until clarity emerges from chaos.</p>
              <div className="ml-stats stagger-root">
                <div className="ml-stat" data-reveal="scale">
                  <span className="ml-stat-value" data-count="175">0</span>
                  <span className="ml-stat-label">Billion Parameters</span>
                </div>
                <div className="ml-stat" data-reveal="scale">
                  <span className="ml-stat-value" data-count="99.7">0</span>
                  <span className="ml-stat-label">% Accuracy</span>
                </div>
                <div className="ml-stat" data-reveal="scale">
                  <span className="ml-stat-value" data-count="50">0</span>
                  <span className="ml-stat-label">ms Inference</span>
                </div>
              </div>
            </div>
            <div className="ml-neural-canvas" data-reveal="scale">
              <canvas id="neural-net-canvas" ref={canvasRef}></canvas>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
