"use client";

import { useRef, useState, useEffect } from 'react';
import './page.css';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== "undefined") {
  gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);
}

const ORBIT_RATIO = 0.44;
const planetsData = [
  { id: 'text', name: 'Text', rx: 200, ry: 200 * ORBIT_RATIO, dur: 12, color: '#00f3ff', angle: 0 },
  { id: 'image', name: 'Image', rx: 280, ry: 280 * ORBIT_RATIO, dur: 16, color: '#b56cff', angle: 0 },
  { id: 'audio', name: 'Audio', rx: 360, ry: 360 * ORBIT_RATIO, dur: 20, color: '#ff006e', angle: 0 },
  { id: 'video', name: 'Video', rx: 440, ry: 440 * ORBIT_RATIO, dur: 24, color: '#00ffcc', angle: 0 },
  { id: 'code', name: 'Code', rx: 520, ry: 520 * ORBIT_RATIO, dur: 28, color: '#4d9fff', angle: 0 }
];

function Typewriter({ text, speed = 30, delay = 0 }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsFinished(false);

    let timeout;
    const startTyping = () => {
      let i = 0;
      const type = () => {
        if (i < text.length) {
          setDisplayedText(text.substring(0, i + 1));
          i++;
          timeout = setTimeout(type, speed);
        } else {
          setIsFinished(true);
        }
      };
      type();
    };
    

    const initialDelay = setTimeout(startTyping, delay);
    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timeout);
    };
  }, [text, speed, delay]);

  return (
    <span className="typewriter-container">
      {displayedText}
      {!isFinished && <span className="typewriter-cursor">|</span>}
    </span>
  );
}

function VoiceGenerator({ text, color }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const barsRef = useRef(null);
  const requestRef = useRef();
  const lastFrameTime = useRef(0);
  const barCount = 40;

  const animate = (time) => {
    // Throttle to ~15fps for waveform — no perceptible difference vs 60fps
    if (time - lastFrameTime.current < 66) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTime.current = time;

    if (barsRef.current) {
      const bars = barsRef.current.children;
      for (let i = 0; i < bars.length; i++) {
        const h = 0.5 + Math.random() * 2;
        bars[i].style.transform = `scaleY(${h})`;
        bars[i].style.opacity = 0.4 + (h * 0.3);
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isSpeaking) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
      // Reset bars
      if (barsRef.current) {
        const bars = barsRef.current.children;
        for (let i = 0; i < bars.length; i++) {
          bars[i].style.transform = 'scaleY(1)';
          bars[i].style.opacity = '0.2';
        }
      }
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isSpeaking]);

  const speak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.pitch = 0.5; 
    utterance.rate = 0.85;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const timer = setTimeout(speak, 800);
    return () => {
      window.speechSynthesis.cancel();
      clearTimeout(timer);
    };
  }, [text]);

  return (
    <>
      <div className="voice-generator-container full-area">
        <div className={`waveform-visualizer ${isSpeaking ? 'is-speaking' : ''}`} style={{ '--wave-color': color }} ref={barsRef}>
          {Array.from({ length: barCount }).map((_, i) => (
            <div 
              key={i} 
              className="wave-line" 
              style={{ 
                '--idx': i,
                transform: 'scaleY(1)',
                opacity: 0.2
              }}
            ></div>
          ))}
        </div>
      </div>
      <button className="voice-action-btn outside-btn" onClick={speak} style={{ '--btn-color': color }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
        Replay Audio Synthesis
      </button>
    </>
  );
}

function VisualGenerator({ text, color, fontSize = "5rem" }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="visual-generator-container">
      <div className="visual-canvas">
        <div className="noise-overlay" style={{ opacity: 1 - progress / 100 }}></div>
        <div className="resolved-content" style={{ opacity: progress / 100, color: color, fontSize: fontSize }}>
          {text}
        </div>
        <div className="scan-line"></div>
      </div>
      <div className="gen-progress-bar">
        <div className="gen-progress-fill" style={{ width: `${progress}%`, background: color }}></div>
      </div>
      <div className="gen-stats">
        <span>SAMPLING: {progress}%</span>
        <span>LATENT SPACE: RESOLVING</span>
      </div>
    </div>
  );
}

function VideoGenerator({ color }) {
  const [progress, setProgress] = useState(0);
  const [isResolved, setIsResolved] = useState(false);
  const [activeFrame, setActiveFrame] = useState(0);
  const totalFrames = 24;

  useEffect(() => {
    let interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsResolved(true);
          return 100;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isResolved) {
      let frameInterval = setInterval(() => {
        setActiveFrame(prev => (prev + 1) % totalFrames);
      }, 50);
      return () => clearInterval(frameInterval);
    } else {
       let frameInterval = setInterval(() => {
        setActiveFrame(prev => (prev + 1) % totalFrames);
      }, 100);
      return () => clearInterval(frameInterval);
    }
  }, [isResolved, totalFrames]);

  const progressRatio = activeFrame / (totalFrames - 1 || 1);
  // Starts off-screen left (-350px) and moves to off-screen right (+350px)
  const xPos = -350 + (progressRatio * 700);
  // Bounces 4 times across the screen
  const yPos = -Math.abs(Math.sin(progressRatio * Math.PI * 4)) * 60;

  return (
    <div className="video-generator-container">
      <div className="video-main-screen" style={{ '--theme-color': color }}>
        <div className="video-overlay" style={{ opacity: isResolved ? 0 : 0.8 }}></div>
        <div className="video-content" style={{ opacity: isResolved ? 1 : 0.3 }}>
           <div className="animated-subject" style={{ 
             transform: `translate(${xPos}px, ${yPos}px) scale(${1 + (yPos / -60) * 0.2})`,
             transition: activeFrame === 0 ? 'none' : 'transform 0.05s linear'
           }}>
             <div className="subject-core" style={{ background: color, boxShadow: `0 0 20px ${color}` }}></div>
             <div className="subject-ring" style={{ borderColor: color }}></div>
           </div>
        </div>
        {!isResolved && (
          <div className="rendering-status">
            <span>GENERATING TENSORS</span>
            <div className="loading-bar">
              <div className="loading-fill" style={{ width: `${progress}%`, background: color }}></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="video-timeline">
        {Array.from({ length: totalFrames }).map((_, idx) => {
          const idxRatio = idx / (totalFrames - 1 || 1);
          const dotY = -Math.abs(Math.sin(idxRatio * Math.PI * 3)) * 10;
          return (
            <div 
              key={idx} 
              className={`timeline-frame ${activeFrame === idx ? 'active' : ''}`}
              style={{ 
                '--frame-color': color,
                borderColor: activeFrame === idx ? color : 'rgba(255, 255, 255, 0.1)',
                background: activeFrame === idx ? `${color}20` : 'transparent'
              }}
            >
              <div className="frame-inner" style={{ opacity: isResolved ? 1 : 0.2 }}>
                 <div className="frame-dot" style={{ 
                   transform: `translateY(${dotY}px)`,
                   background: color 
                 }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CodeGenerator({ color }) {
  const codeLines = [
    "export class AIGenerator {",
    "  public async generate(prompt: string) {",
    "    const tensor = Neural.encode(prompt);",
    "    const logic = await Core.predict(tensor);",
    "    return Decoder.parse(logic);",
    "  }",
    "}"
  ];

  const [visibleLines, setVisibleLines] = useState(0);
  const [currentChars, setCurrentChars] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (isDone) return;

    let timeout;
    if (visibleLines < codeLines.length) {
      const currentLine = codeLines[visibleLines];
      if (currentChars < currentLine.length) {
        timeout = setTimeout(() => {
          setCurrentChars(prev => prev + 1);
        }, 15);
      } else {
        timeout = setTimeout(() => {
          setVisibleLines(prev => prev + 1);
          setCurrentChars(0);
        }, 80);
      }
    } else {
      setIsDone(true);
    }

    return () => clearTimeout(timeout);
  }, [visibleLines, currentChars, isDone, codeLines]);

  return (
    <div className="code-generator-container">
      <div className="code-window">
        <div className="code-content" style={{ '--theme-color': color }}>
          {codeLines.map((line, idx) => {
            if (idx > visibleLines) return null;
            
            const isCurrentLine = idx === visibleLines;
            const textToShow = isCurrentLine ? line.substring(0, currentChars) : line;
            
            return (
              <div key={idx} className="code-line">
                <span className="line-number">{idx + 1}</span>
                <span className="line-text">
                  {textToShow}
                  {isCurrentLine && !isDone && <span className="code-cursor">|</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const MODALITY_ICONS = {
  text: <path d="M4 6h16M4 12h16M4 18h10" />,
  image: <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21" />,
  audio: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" /></>,
  video: <><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></>,
  code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>
};
 
 const handleCardTilt = (e) => {
   const card = e.currentTarget;
   const rect = card.getBoundingClientRect();
   const x = e.clientX - rect.left;
   const y = e.clientY - rect.top;
   const centerX = rect.width / 2;
   const centerY = rect.height / 2;
   const rotateX = ((y - centerY) / centerY) * -10; // Max 10 degrees
   const rotateY = ((x - centerX) / centerX) * 10; // Max 10 degrees
 
   gsap.to(card, {
     rotateX: rotateX,
     rotateY: rotateY,
     scale: 1.02,
     duration: 0.5,
     ease: "power2.out"
   });
 };
 
 const resetCardTilt = (e) => {
   const card = e.currentTarget;
   gsap.to(card, {
     rotateX: 0,
     rotateY: 0,
     scale: 1,
     duration: 0.5,
     ease: "power2.out"
   });
 };


function GenerativeAISection({ isLoaded }) {
  const containerRef = useRef(null);
  const coreRef = useRef(null);
  const planetsRef = useRef([]);
  const pathsRef = useRef([]);
  const [activeModality, setActiveModality] = useState(null);
  const [hoveredModality, setHoveredModality] = useState(null);
  const animationsRef = useRef({});

  useEffect(() => {
    if (!containerRef.current || !isLoaded) return;

    // Manually trigger reveal for headers to be ready before visiting
    containerRef.current.querySelectorAll('[data-reveal]').forEach(el => {
      el.classList.add('reveal-active');
    });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      gsap.set(planetsRef.current, { scale: 0 });
      gsap.set(coreRef.current, { scale: 0 });

      tl.to(coreRef.current, { 
        scale: 1, 
        autoAlpha: 1, 
        duration: 0.5, 
        ease: "back.out(2)",
        force3D: true 
      })
        .to(planetsRef.current, {
          scale: 1,
          autoAlpha: 1,
          duration: 0.5,
          ease: "power2.out",
          force3D: true,
          stagger: {
            each: 0.08,
            onComplete: function() {
              const el = this.targets()[0];
              const i = planetsRef.current.indexOf(el);
              const planet = planetsData[i];
              const pathEl = pathsRef.current[i];
              
              if (el && pathEl) {
                const orbit = gsap.to(el, {
                  motionPath: {
                    path: pathEl,
                    align: pathEl,
                    alignOrigin: [0.5, 0.5]
                  },
                  duration: planet.dur,
                  ease: "none",
                  repeat: -1,
                  force3D: true
                });
                animationsRef.current[planet.id] = orbit;
              }
            }
          }
        }, "-=0.3");
    }, containerRef);
    return () => ctx.revert();
  }, [isLoaded]);

  useEffect(() => {
    planetsData.forEach((planet) => {
      const anim = animationsRef.current[planet.id];
      if (anim) {
        if (activeModality) {
          gsap.to(anim, { timeScale: 0, duration: 0.5 });
        } else if (hoveredModality === planet.id) {
          gsap.to(anim, { timeScale: 0.2, duration: 0.5 });
        } else {
          gsap.to(anim, { timeScale: 1, duration: 0.5 });
        }
      }
    });
  }, [hoveredModality, activeModality]);

  const handlePlanetClick = (id) => {
    setActiveModality(id);
  };

  const getArtifactContent = (id) => {
    switch (id) {
      case 'text': return (
        <div className="artifact-text">
          <p style={{ marginBottom: '1rem' }}>
            <Typewriter text="USER: How do you generate text?" speed={30} />
          </p>
          <p style={{ color: '#00f3ff', lineHeight: '1.8' }}>
            <Typewriter text="AI: I analyze the context of your request and navigate a multi-dimensional map of language to find the most coherent path forward. Every letter you see is a mathematical prediction." speed={30} delay={1500} />
          </p>
        </div>
      );
      case 'image': return (
        <div className="artifact-image">
          <VisualGenerator text="HELLO WORLD" color="#b56cff" fontSize="2.5rem" />
          <p style={{ marginTop: '1rem' }}>
            <Typewriter text="Converting noise to semantic structure..." speed={40} />
            <br />
            <Typewriter text="> Denoising diffusion process active" speed={40} delay={1500} />
          </p>
        </div>
      );
      case 'audio': return (
        <div className="artifact-audio">
          <VoiceGenerator text="Welcome to the Neural Nexus. I am the voice of the architecture. I translate complex data into the frequencies of human understanding." color="#ff006e" />
          <p style={{ marginTop: '1.5rem' }}>
            <Typewriter text="Frequency modulation in progress..." speed={40} />
            <br />
            <Typewriter text="> Adaptive vocoder active" speed={40} delay={1500} />
          </p>
        </div>
      );
      case 'video': return (
        <div className="artifact-video">
          <VideoGenerator color="#00ffcc" />
          <p style={{ marginTop: '1.5rem' }}>
            <Typewriter text="Synthesizing temporal sequences..." speed={40} />
            <br />
            <Typewriter text="> Frame interpolation active" speed={40} delay={1500} />
          </p>
        </div>
      );
      case 'code': return (
        <div className="artifact-code">
          <CodeGenerator color="#ffcc00" />
          <p style={{ marginTop: '1.5rem' }}>
            <Typewriter text="Compiling logic pathways..." speed={40} />
            <br />
            <Typewriter text="> Syntax optimized" speed={40} delay={3000} />
          </p>
        </div>
      );
      default: return null;
    }
  };

  return (
    <section className="gen-ai-section" id="generative-ai" ref={containerRef}>

      <div className="gen-ai-header-bar">
        <h2 className="gen-ai-label" data-reveal="up">Gen AI</h2>
        <p className="gen-ai-subtext" data-reveal="up">Multi-modal neural synthesis across text, image, audio, video &amp; code</p>
      </div>

      <div className="orbital-system">
        <svg className="orbits-svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 243, 255, 0.4)" />
              <stop offset="100%" stopColor="rgba(0, 243, 255, 0)" />
            </radialGradient>
          </defs>



          {planetsData.map((planet, i) => {
             // Calculate rotated endpoints to ensure GSAP follows the tilted path correctly
             const rad = (planet.angle * Math.PI) / 180;
             const sinA = Math.sin(rad);
             const cosA = Math.cos(rad);
             
             // Top point (relative to 600, 300)
             const tx = 0;
             const ty = -planet.ry;
             const rx1 = 600 + (tx * cosA - ty * sinA);
             const ry1 = 300 + (tx * sinA + ty * cosA);
             
             // Bottom point (relative to 600, 300)
             const bx = 0;
             const by = planet.ry;
             const rx2 = 600 + (bx * cosA - by * sinA);
             const ry2 = 300 + (bx * sinA + by * cosA);

             return (
              <path
                key={`orbit-${planet.id}`}
                id={`orbit-${planet.id}`}
                ref={el => pathsRef.current[i] = el}
                d={`M ${rx1},${ry1} A ${planet.rx},${planet.ry} ${planet.angle} 1,0 ${rx2},${ry2} A ${planet.rx},${planet.ry} ${planet.angle} 1,0 ${rx1},${ry1}`}
                className={`orbit-path ${hoveredModality === planet.id ? 'highlighted' : ''}`}
                style={{ 
                  '--orbit-color': planet.color
                }}
              />
             );
          })}
        </svg>

        <div className="synthesis-core" ref={coreRef}>
          <div className="core-inner"></div>
          <div className="core-halo"></div>
          <div className="core-label">SYNTHESIS CORE</div>
        </div>

        {planetsData.map((planet, i) => (
          <div
            key={planet.id}
            className={`modality-planet ${activeModality === planet.id ? 'active' : ''} ${activeModality && activeModality !== planet.id ? 'dimmed' : ''}`}
            ref={el => planetsRef.current[i] = el}
            onMouseEnter={() => setHoveredModality(planet.id)}
            onMouseLeave={() => setHoveredModality(null)}
            onClick={() => handlePlanetClick(planet.id)}
            style={{ 
              '--planet-color': planet.color
            }}
          >
            <div className="planet-halo"></div>
            <div className="planet-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {MODALITY_ICONS[planet.id]}
              </svg>
            </div>
            <div className="planet-label">{planet.name}</div>
          </div>
        ))}
      </div>

      <div className={`artifact-card-modal ${activeModality ? 'visible' : ''}`}>
        <div className="artifact-card-backdrop" onClick={() => setActiveModality(null)}></div>
        <div className="artifact-card glassmorphic" onMouseMove={handleCardTilt} onMouseLeave={resetCardTilt}>
          <button className="close-btn" onClick={() => setActiveModality(null)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
          {activeModality && (
            <div className="artifact-content">
              <div className="artifact-header" style={{ color: planetsData.find(p => p.id === activeModality)?.color }}>
                <h3>{planetsData.find(p => p.id === activeModality)?.name} Modality</h3>
              </div>
              <div className="artifact-body">
                {getArtifactContent(activeModality)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const parallaxWrapperRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeFlowNode, setActiveFlowNode] = useState(null);

  const handleMouseMove = (e) => {
    // 1. Existing gradient logic for text
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      containerRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`);
      containerRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`);
    }

    // 2. New Mouse Parallax Logic
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const moveX = (clientX - centerX) / centerX; // Range -1 to 1
    const moveY = (clientY - centerY) / centerY; // Range -1 to 1

    // Foreground (Cyborg) moves slightly towards the mouse direction
    gsap.to(".cyborg-near", {
      x: moveX * 50,
      y: moveY * 30,
      duration: 0.5,
      ease: "power2.out"
    });

    // Background (Blur) moves in the opposite direction for 3D depth
    gsap.to(".bg-far", {
      x: moveX * -30,
      y: moveY * -20,
      duration: 0.5,
      ease: "power2.out"
    });
  };

  // Cinematic Entrance Animation (Emergence Effect)
  useEffect(() => {
    const entranceTl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 3 }
    });

    // 1. Background settles (Zooms out and clears blur)
    entranceTl.fromTo(".bg-far",
      { scale: 1.5, opacity: 0, filter: "blur(20px) brightness(0.4)" },
      { scale: 1, opacity: 1, filter: "blur(0px) brightness(1)", duration: 3 },
      0
    );

    // 2. Cyborg emerges (Zooms in)
    entranceTl.fromTo(".cyborg-near",
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1 },
      0.3
    );

    // 3. UI Elements fade in (Slower and staggered)
    entranceTl.fromTo(".minimal-header",
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 2, ease: "power2.out" },
      1.0
    );

    entranceTl.fromTo(".minimal-heading",
      { opacity: 0, y: 30, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" },
      1.5
    );

    entranceTl.fromTo(".minimal-subtext",
      { opacity: 0, y: 20, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 2.5, ease: "power2.out" },
      1.8 // Staggered by 0.3s
    );

    entranceTl.fromTo(".system-status",
      { opacity: 0, x: 30, filter: "blur(4px)" },
      { opacity: 1, x: 0, filter: "blur(0px)", duration: 3, ease: "power2.out" },
      2.1 // Staggered later
    );

    // 4. Consolidate: Fade out the near layer to leave the crisp background
    entranceTl.to(".cyborg-near", { opacity: 0, duration: 1 }, "-=0.5");

    return () => entranceTl.kill();
  }, []);




  // Parallax Scrolling Effects
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cinematic Hero Parallax Scroll Transition
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "+=100%", // Pin for exactly 100vh of scrolling
          pin: true,
          pinSpacing: false, // Essential: allows ML section to slide up and overlap
          scrub: 1, // Smooth butter scrubbing (60 FPS feel)
        }
      });

      // Move text up perfectly in sync with the second page (ML section) over the full scroll duration
      heroTl.to(".ui-layer", {
        y: "-100vh", // Matches the exact 100vh scroll
        ease: "none", // Must be "none" to stay perfectly synced with linear browser scrolling
        duration: 1
      }, 0);

      // Fade out text completely by 50% of the scroll, so it's entirely invisible before leaving the screen
      heroTl.to(".ui-layer", {
        opacity: 0,
        ease: "power2.out", // Eases the fade out
        duration: 0.5 // Takes only the first half of the scroll distance
      }, 0);

      // Hero background translates up simultaneously over the entire scroll duration
      heroTl.to(".hero-mouse-parallax", {
        yPercent: -50, // Move background up to create strong parallax with the rising ML section
        ease: "none", // Keeps parallax consistent and linear
        duration: 1
      }, 0);

      // ML Section Orbs Parallax
      document.querySelectorAll('.ml-bg-orb').forEach(orb => {
        const speed = parseFloat(getComputedStyle(orb).getPropertyValue('--parallax-offset')) || 50;
        gsap.to(orb, {
          y: speed,
          ease: "none",
          scrollTrigger: {
            trigger: orb.closest('section'),
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      });
    });

    return () => ctx.revert();
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

    return () => {
      revealObserver.disconnect();
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
    let isHovering = false;
    let shapeIndex = 0;
    let lastShapeSwitch = 0;
    let angleX = 0;
    let angleY = 0;
    const shapes = ['cube', 'pyramid', 'rectangle', 'hexagon'];

    // ─── Device Capability Detection (early, so draw() can reference it) ──
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    const getTargetPos3D = (index, shape, size) => {
      switch (shape) {
        case 'cube': {
          // 3x3x3 grid (27 nodes) + 1 center
          if (index < 27) {
            const ix = (index % 3) - 1;
            const iy = (Math.floor(index / 3) % 3) - 1;
            const iz = Math.floor(index / 9) - 1;
            return { x: ix * (size * 0.4), y: iy * (size * 0.4), z: iz * (size * 0.4) };
          }
          return { x: 0, y: 0, z: 0 };
        }
        case 'pyramid': {
          // Layered triangles: 1, 3, 6, 10, 8
          if (index < 1) return { x: 0, y: -size * 0.5, z: 0 };
          if (index < 4) {
            const angle = ((index - 1) / 3) * Math.PI * 2;
            return { x: Math.cos(angle) * (size * 0.2), y: -size * 0.2, z: Math.sin(angle) * (size * 0.2) };
          }
          if (index < 10) {
            const angle = ((index - 4) / 6) * Math.PI * 2;
            return { x: Math.cos(angle) * (size * 0.4), y: size * 0.1, z: Math.sin(angle) * (size * 0.4) };
          }
          if (index < 20) {
            const angle = ((index - 10) / 10) * Math.PI * 2;
            return { x: Math.cos(angle) * (size * 0.6), y: size * 0.4, z: Math.sin(angle) * (size * 0.6) };
          }
          const angle = ((index - 20) / 8) * Math.PI * 2;
          return { x: Math.cos(angle) * (size * 0.4), y: size * 0.2, z: Math.sin(angle) * (size * 0.4) };
        }
        case 'rectangle': {
          // 7x4 grid on a 3D plane with some thickness
          const row = Math.floor(index / 7);
          const col = index % 7;
          const zDepth = (index % 2 === 0 ? 1 : -1) * (size * 0.1);
          return {
            x: (col / 6 - 0.5) * (size * 1.3),
            y: (row / 3 - 0.5) * (size * 0.8),
            z: zDepth
          };
        }
        case 'hexagon': {
          // Two hexagons (6+6) connected in Z-space + 16 internal nodes
          if (index < 12) {
            const side = Math.floor(index / 6);
            const angle = (index % 6 / 6) * Math.PI * 2;
            const z = (side === 0 ? 0.3 : -0.3) * size;
            return { x: Math.cos(angle) * (size * 0.5), y: Math.sin(angle) * (size * 0.5), z };
          } else {
            const angle = ((index - 12) / 16) * Math.PI * 2;
            const r = (size * 0.25);
            return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, z: 0 };
          }
        }
        default: return { x: 0, y: 0, z: 0 };
      }
    };

    const project3D = (x, y, z, cx, cy) => {
      const fov = 500;
      // Rotate around X and Y axes
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Rotate Y
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;

      // Rotate X
      let y1 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;

      const scale = fov / (fov + z2);
      return {
        px: x1 * scale + cx,
        py: y1 * scale + cy,
        scale,
        depth: z2
      };
    };

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
        const x = layerSpacing * (li + 1) - w / 2; // Relative to center
        const nodeSpacing = h / (count + 1);
        for (let ni = 0; ni < count; ni++) {
          const y = nodeSpacing * (ni + 1) - h / 2; // Relative to center
          nodes.push({
            x, y, z: 0,
            ox: x, oy: y, oz: 0,
            tx: x, ty: y, tz: 0,
            layer: li,
            radius: 4 + Math.random() * 3,
            pulse: Math.random() * Math.PI * 2
          });
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
      const size = Math.min(w, h) * 0.6;
      ctx.clearRect(0, 0, w, h);

      if (isHovering) {
        angleX += 0.002;
        angleY += 0.003;
        // Auto-cycle shapes on desktop only; mobile waits for manual taps
        if (!isTouchDevice && time - lastShapeSwitch > 1500) {
          shapeIndex = (shapeIndex + 1) % shapes.length;
          lastShapeSwitch = time;
        }
      } else {
        angleX *= 0.95;
        angleY *= 0.95;
      }

      nodes.forEach((node, i) => {
        const target = isHovering
          ? getTargetPos3D(i, shapes[shapeIndex], size)
          : { x: node.ox, y: node.oy, z: 0 };

        node.tx = target.x;
        node.ty = target.y;
        node.tz = target.z;

        // Fluid 3D Lerp
        node.x += (node.tx - node.x) * 0.08;
        node.y += (node.ty - node.y) * 0.08;
        node.z += (node.tz - node.z) * 0.08;
      });

      // Build projection data with O(1) index lookup
      const projectedByIndex = new Array(nodes.length);
      const projectedNodes = nodes.map((node, i) => {
        const proj = {
          ...node,
          ...project3D(node.x, node.y, node.z, w / 2, h / 2),
          originalIndex: i
        };
        projectedByIndex[i] = proj;
        return proj;
      });
      projectedNodes.sort((a, b) => b.depth - a.depth);

      const lineOpacity = isHovering ? 0.04 : 0.08;

      connections.forEach(conn => {
        const from = projectedByIndex[conn.from];
        const to = projectedByIndex[conn.to];
        if (!from || !to) return;

        ctx.beginPath();
        ctx.moveTo(from.px, from.py);
        ctx.lineTo(to.px, to.py);
        const opacity = lineOpacity * Math.min(from.scale, to.scale);
        ctx.strokeStyle = `rgba(0, 243, 255, ${opacity})`;
        ctx.lineWidth = 0.5 * Math.min(from.scale, to.scale);
        ctx.stroke();

        conn.progress += conn.speed;
        if (conn.progress > 1) conn.progress = 0;
        const px = from.px + (to.px - from.px) * conn.progress;
        const py = from.py + (to.py - from.py) * conn.progress;
        ctx.beginPath();
        ctx.arc(px, py, 2 * from.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 243, 255, ${0.6 * (1 - Math.abs(conn.progress - 0.5) * 2) * (isHovering ? 0.5 : 1) * from.scale})`;
        ctx.fill();
      });

      projectedNodes.forEach(node => {
        const glow = 0.5 + 0.5 * Math.sin(time * 0.002 + node.pulse);
        const r = node.radius * node.scale;

        ctx.beginPath();
        ctx.arc(node.px, node.py, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 243, 255, ${(0.1 + glow * 0.3) * node.scale})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.px, node.py, r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 243, 255, ${(0.5 + glow * 0.5) * node.scale})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.px, node.py, r + 4 * glow * node.scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 243, 255, ${0.05 * glow * node.scale})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animId = requestAnimationFrame(draw);
    }

    const parent = canvas.parentElement;

    // (isTouchDevice already detected at top of useEffect)

    // ─── Desktop: Hover to Transform (unchanged) ──────────────────
    const handleMouseEnter = () => {
      isHovering = true;
      shapeIndex = (shapeIndex + 1) % shapes.length;
      lastShapeSwitch = performance.now();
    };
    const handleMouseLeave = () => { isHovering = false; };

    // ─── Mobile: Tap to Transform ──────────────────────────────────
    // Every tap advances to the next shape and keeps 3D rotation active.
    // No toggle — once tapped, the canvas stays in "transformed" mode
    // and each subsequent tap just cycles the shape forward.
    const handleMobileTap = (e) => {
      // Prevent ghost-click double-fire on touch devices
      if (e.type === 'touchstart') e.preventDefault();

      // Always keep hovering ON so rotation + shape rendering continues
      isHovering = true;
      // Advance to the next shape on every tap
      shapeIndex = (shapeIndex + 1) % shapes.length;
      lastShapeSwitch = performance.now();
    };

    // ─── Bind the correct handler set per device type ─────────────
    if (parent) {
      if (isTouchDevice) {
        // Mobile path: use touchstart (primary) + click (fallback for
        // devices that report coarse but still fire click events).
        // touchstart fires first; preventDefault stops the click duplicate.
        parent.addEventListener('touchstart', handleMobileTap, { passive: false });
        parent.addEventListener('click', handleMobileTap);
      } else {
        // Desktop path: classic hover behaviour
        parent.addEventListener('mouseenter', handleMouseEnter);
        parent.addEventListener('mouseleave', handleMouseLeave);
      }
    }

    // ─── Visibility Observer (start / pause animation) ────────────
    const canvasObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          resize();
          if (!animId) animId = requestAnimationFrame(draw);
        } else {
          cancelAnimationFrame(animId);
          animId = null;
          // Safety: reset hover state when canvas scrolls out of view
          // so mobile doesn't get stuck in "hovering" mode.
          if (isTouchDevice) isHovering = false;
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

    // ─── Cleanup ──────────────────────────────────────────────────
    return () => {
      canvasObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (parent) {
        if (isTouchDevice) {
          parent.removeEventListener('touchstart', handleMobileTap);
          parent.removeEventListener('click', handleMobileTap);
        } else {
          parent.removeEventListener('mouseenter', handleMouseEnter);
          parent.removeEventListener('mouseleave', handleMouseLeave);
        }
      }
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // ML -> NN Parallax Scroll Transition
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!parallaxWrapperRef.current) return;
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: parallaxWrapperRef.current,
          start: "top top", // Pin when the wrapper hits the top
          end: "+=2000", // Scroll duration for this transition
          pin: true,
          scrub: 1,
          anticipatePin: 1
        },
        defaults: { force3D: true, ease: "none" }
      });

      // 1. Initial states
      // Hide ML individual elements for staggered entrance
      gsap.set(".ml-engine-node, .ml-flow-node, .ml-flow-paths", { y: 150, autoAlpha: 0 });
      // Hide entire NN container and its orbs to prevent overlap
      gsap.set(".ml-visualization", { y: 150, autoAlpha: 0 });

      // 2. ML Entrance (Synchronized)
      tl.to(".ml-flow-paths, .ml-engine-node, .ml-flow-node", { 
        y: 0, 
        autoAlpha: 1, 
        duration: 1, 
        ease: "power2.out" 
      }, 0);

      // Pause briefly for user to view ML section
      tl.addLabel("ml-revealed").to({}, { duration: 0.8 });

      // 3. ML exits upward completely
      tl.to(".ml-container", {
        y: -150,
        autoAlpha: 0,
        duration: 1.5,
        ease: "power2.in"
      }, "ml-revealed+=0.5");

      // 4. NN enters upward AFTER ML has exited
      tl.to(".ml-visualization", {
        y: 0,
        autoAlpha: 1,
        duration: 1.5,
        ease: "power2.out"
      }, ">+=0.2"); // ">+=0.2" means wait 0.2s after the previous animation finishes
      
    }, parallaxWrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <main>
        <section className="hero-section" id="hero" onMouseMove={handleMouseMove}>
          <div className="hero-mouse-parallax">
            {/* Multi-layered background for 3D emergence effect */}
            <div className="hero-bg bg-far"></div>
            <div className="hero-bg cyborg-near"></div>
          </div>


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
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <h1 className="minimal-heading interactive-text" data-reveal="fade-up">
                NEURAL CORE
              </h1>
              <p className="minimal-subtext">Designed for the future<br />Beyond code. Beyond logic.</p>
            </div>

            <div className="system-status-wrapper">
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
          </div>
        </section>

        <div className="parallax-ml-nn-wrapper" ref={parallaxWrapperRef}>
          <div className="parallax-shared-bg"></div>

          <section className="ml-section parallax-section" id="machine-learning">

          <div className="ml-container">
            {/* === INTERACTIVE FLOWCHART ARCHITECTURE === */}
            <div className="ml-flowchart" data-active-node={activeFlowNode || ''}>
              {/* SVG Connection Paths */}
              <svg className="ml-flow-paths" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  {/* Pulse gradients maintained for potential use */}
                  <linearGradient id="pulse-grad-supervised" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="45%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#00f3ff" />
                    <stop offset="55%" stopColor="transparent" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>

                  <linearGradient id="pulse-grad-unsupervised" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="45%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#b56cff" />
                    <stop offset="55%" stopColor="transparent" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>

                  <linearGradient id="pulse-grad-reinforcement" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="45%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#ff006e" />
                    <stop offset="55%" stopColor="transparent" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>

                {/* Path: Center → Supervised (Top Right) */}
                <path className="flow-line flow-line--supervised" d="M 255 300 C 450 300, 500 140, 672 140"
                  stroke="rgba(0,243,255,0.12)" strokeWidth="2" fill="none" />
                <circle className="flow-pulse flow-pulse--supervised" r="5" fill="#00f3ff"
                  style={{ filter: 'drop-shadow(0 0 5px #00f3ff)' }} shapeRendering="optimizeSpeed">
                  <animateMotion dur="3s" repeatCount="indefinite" path="M 255 300 C 450 300, 500 140, 672 140" />
                </circle>
                <circle className="flow-pulse flow-pulse--supervised" r="3" fill="#00f3ff" opacity="0.5"
                  style={{ filter: 'drop-shadow(0 0 3px #00f3ff)' }} shapeRendering="optimizeSpeed">
                  <animateMotion dur="3s" begin="1.5s" repeatCount="indefinite" path="M 255 300 C 450 300, 500 140, 672 140" />
                </circle>

                {/* Path: Center → Unsupervised (Center Right) */}
                <path className="flow-line flow-line--unsupervised" d="M 255 300 C 450 300, 550 300, 672 300"
                  stroke="rgba(181,108,255,0.12)" strokeWidth="2" fill="none" />
                <circle className="flow-pulse flow-pulse--unsupervised" r="5" fill="#b56cff"
                  style={{ filter: 'drop-shadow(0 0 5px #b56cff)' }} shapeRendering="optimizeSpeed">
                  <animateMotion dur="2.8s" begin="0.4s" repeatCount="indefinite" path="M 255 300 C 450 300, 550 300, 672 300" />
                </circle>
                <circle className="flow-pulse flow-pulse--unsupervised" r="3" fill="#b56cff" opacity="0.5"
                  style={{ filter: 'drop-shadow(0 0 3px #b56cff)' }} shapeRendering="optimizeSpeed">
                  <animateMotion dur="2.8s" begin="1.8s" repeatCount="indefinite" path="M 255 300 C 450 300, 550 300, 672 300" />
                </circle>

                {/* Path: Center → Reinforcement (Bottom Right) */}
                <path className="flow-line flow-line--reinforcement" d="M 255 300 C 450 300, 500 460, 672 460"
                  stroke="rgba(255,0,110,0.12)" strokeWidth="2" fill="none" />
                <circle className="flow-pulse flow-pulse--reinforcement" r="5" fill="#ff006e"
                  style={{ filter: 'drop-shadow(0 0 5px #ff006e)' }} shapeRendering="optimizeSpeed">
                  <animateMotion dur="3.2s" begin="0.8s" repeatCount="indefinite" path="M 255 300 C 450 300, 500 460, 672 460" />
                </circle>
                <circle className="flow-pulse flow-pulse--reinforcement" r="3" fill="#ff006e" opacity="0.5"
                  style={{ filter: 'drop-shadow(0 0 3px #ff006e)' }} shapeRendering="optimizeSpeed">
                  <animateMotion dur="3.2s" begin="2.2s" repeatCount="indefinite" path="M 255 300 C 450 300, 500 460, 672 460" />
                </circle>
              </svg>

              {/* === CENTRAL ENGINE NODE === */}
              <div className="ml-engine-node"
                style={{ '--engine-glow': activeFlowNode === 'supervised' ? '#00f3ff' : activeFlowNode === 'unsupervised' ? '#b56cff' : activeFlowNode === 'reinforcement' ? '#ff006e' : '#00f3ff' }}
              >
                <div className="ml-engine-icon">
                  {/* Animated Brain/Processor SVG */}
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                      <animateTransform attributeName="transform" type="rotate" dur="20s" repeatCount="indefinite" from="0 24 24" to="360 24 24" />
                    </circle>
                    <circle cx="24" cy="24" r="12" stroke="currentColor" strokeWidth="1" opacity="0.5">
                      <animateTransform attributeName="transform" type="rotate" dur="12s" repeatCount="indefinite" from="360 24 24" to="0 24 24" />
                    </circle>
                    {/* Neural core */}
                    <circle cx="24" cy="24" r="4" fill="currentColor" opacity="0.8">
                      <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Synaptic connections */}
                    <line x1="24" y1="6" x2="24" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    <line x1="24" y1="34" x2="24" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    <line x1="6" y1="24" x2="14" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    <line x1="34" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    <line x1="11.27" y1="11.27" x2="16.97" y2="16.97" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                    <line x1="31.03" y1="31.03" x2="36.73" y2="36.73" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                    <line x1="36.73" y1="11.27" x2="31.03" y2="16.97" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                    <line x1="16.97" y1="31.03" x2="11.27" y2="36.73" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                    {/* Outer pulse ring */}
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.15">
                      <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.15;0.05;0.15" dur="3s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>
                <h3 className="ml-engine-label">MACHINE LEARNING ENGINE</h3>
                <p className="ml-engine-sublabel">Core Intelligence Architecture</p>
              </div>

              {/* === SUB-CATEGORY NODES === */}
              <div className="ml-flow-nodes">
                {/* Supervised Learning */}
                <div className="ml-flow-node ml-flow-node--supervised"
                  onMouseEnter={() => setActiveFlowNode('supervised')}
                  onMouseLeave={(e) => { setActiveFlowNode(null); resetCardTilt(e); }}
                  onMouseMove={handleCardTilt}
                  style={{ '--node-accent': '#00f3ff', '--node-accent-bg': 'rgba(0,243,255,0.06)', '--node-accent-border': 'rgba(0,243,255,0.2)' }}
                >
                  <div className="ml-flow-node-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                  </div>
                  <div className="ml-flow-node-content">
                    <span className="ml-flow-node-tag">CLASSIFICATION &bull; REGRESSION</span>
                    <h4>SUPERVISED LEARNING</h4>
                    <p>Pattern Matching & Labelled Data</p>
                  </div>
                  <div className="ml-flow-node-glow"></div>
                </div>

                {/* Unsupervised Learning */}
                <div className="ml-flow-node ml-flow-node--unsupervised"
                  onMouseEnter={() => setActiveFlowNode('unsupervised')}
                  onMouseLeave={(e) => { setActiveFlowNode(null); resetCardTilt(e); }}
                  onMouseMove={handleCardTilt}
                  style={{ '--node-accent': '#b56cff', '--node-accent-bg': 'rgba(181,108,255,0.06)', '--node-accent-border': 'rgba(181,108,255,0.2)' }}
                >
                  <div className="ml-flow-node-icon">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 1v4" /><path d="M12 19v4" /><path d="M4.22 4.22l2.83 2.83" /><path d="M16.95 16.95l2.83 2.83" /><path d="M1 12h4" /><path d="M19 12h4" /><path d="M4.22 19.78l2.83-2.83" /><path d="M16.95 7.05l2.83-2.83" /></svg>
                  </div>
                  <div className="ml-flow-node-content">
                    <span className="ml-flow-node-tag">CLUSTERING &bull; DIMENSIONALITY</span>
                    <h4>UNSUPERVISED LEARNING</h4>
                    <p>Structure Discovery & Clustering</p>
                  </div>
                  <div className="ml-flow-node-glow"></div>
                </div>

                {/* Reinforcement Learning */}
                <div className="ml-flow-node ml-flow-node--reinforcement"
                  onMouseEnter={() => setActiveFlowNode('reinforcement')}
                  onMouseLeave={(e) => { setActiveFlowNode(null); resetCardTilt(e); }}
                  onMouseMove={handleCardTilt}
                  style={{ '--node-accent': '#ff006e', '--node-accent-bg': 'rgba(255,0,110,0.06)', '--node-accent-border': 'rgba(255,0,110,0.2)' }}
                >
                  <div className="ml-flow-node-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></svg>
                  </div>
                  <div className="ml-flow-node-content">
                    <span className="ml-flow-node-tag">AGENTS &bull; REWARDS</span>
                    <h4>REINFORCEMENT LEARNING</h4>
                    <p>Strategy Optimization & Rewards</p>
                  </div>
                  <div className="ml-flow-node-glow"></div>
                </div>
              </div>
            </div>
          </div>
          </section>

          <section className="nn-section parallax-section" id="neural-networks">

          <div className="ml-visualization">
            <div className="ml-viz-content stagger-root">
              <div className="ml-viz-label">Real-time Processing</div>
              <h3 className="ml-viz-title">Neural Network<br />Architecture</h3>
              <p className="ml-viz-desc">Modern machine learning models process millions of data points through layers of interconnected neurons, each one refining the signal until clarity emerges from chaos.</p>
              <div className="ml-stats stagger-root">
                <div className="ml-stat">
                  <span className="ml-stat-value" data-count="175">0</span>
                  <span className="ml-stat-label">Billion Parameters</span>
                </div>
                <div className="ml-stat">
                  <span className="ml-stat-value" data-count="99.7">0</span>
                  <span className="ml-stat-label">% Accuracy</span>
                </div>
                <div className="ml-stat">
                  <span className="ml-stat-value" data-count="50">0</span>
                  <span className="ml-stat-label">ms Inference</span>
                </div>
              </div>
            </div>
            <div className="ml-neural-canvas">
              <canvas id="neural-net-canvas" ref={canvasRef}></canvas>
            </div>
          </div>
        </section>
        </div>

        <GenerativeAISection isLoaded={true} />
      </main>
    </>
  );
}
