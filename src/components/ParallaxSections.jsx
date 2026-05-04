import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ParallaxSections.module.css";

// Register ScrollTrigger to ensure it's available for GSAP
gsap.registerPlugin(ScrollTrigger);

export default function ParallaxSections() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Context wraps all GSAP logic to ensure cleanup on unmount
    let ctxGsap = gsap.context(() => {
      
      // 1. Unified Background Strategy & ScrollTrigger Pinning
      // Pin the entire wrapper container. This keeps the background in place
      // and creates the timeline for our two sections to transition.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",   // Pin starts when the top of the container hits the top of viewport
          end: "+=2000",      // Scroll duration for this section (adjust to control scroll speed)
          pin: true,          // Pins the container
          scrub: 1,           // Smooth scrubbing with a 1-second lag to smooth out wheel events
          anticipatePin: 1,
        },
        defaults: { force3D: true, ease: "none" } // force3D triggers GPU acceleration
      });

      // 2. Staggered Entrance (Machine Learning)
      // Animate the cards from hidden (y: 150) to visible (y: 0)
      tl.fromTo(
        ".ml-flow-node",
        { y: 150, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: { amount: 0.3, from: "center" }, // Cards reveal from center out, staggered
          ease: "power2.out",
        }
      );

      // Add a label to mark the end of the ML entrance, plus a slight pause for reading
      tl.addLabel("ml-revealed")
        .to({}, { duration: 0.5 }); // Dummy tween for pause

      // 3. Coordinated Handoff (ML exits, NN enters)
      // Fade out ML cards moving upward
      tl.to(
        ".ml-flow-node",
        {
          y: -150,          // Move upwards as they exit
          opacity: 0,
          duration: 1,
          stagger: { amount: 0.2 },
          ease: "power2.in"
        },
        "ml-revealed+=0.5"  // Start after the pause
      );

      // Reveal NN contents moving upward from below synchronously
      tl.fromTo(
        ".nn-content",
        { y: 150, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out"
        },
        "<" // Sync EXACTLY with the start of the previous animation (ML exit)
      );

      // 4. Canvas Integration
      // Manage canvas animation state within the timeline
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      const resizeCanvas = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      };
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      // We use a proxy object to drive the canvas drawing based on scroll progress
      const proxy = { progress: 0 };
      tl.to(proxy, {
        progress: 1,
        duration: 1.5,
        onUpdate: () => {
          // Draw Neural Network dots based on proxy.progress
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Example particle drawing logic synchronized with scroll
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = 50 + (100 * proxy.progress); // Expands as you scroll
          const alpha = proxy.progress;
          
          ctx.fillStyle = `rgba(0, 255, 200, ${alpha})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }, "<"); // Starts syncing drawing right as the NN section reveals

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };

    }, containerRef); // Scoped to the container

    return () => {
      ctxGsap.revert(); // GSAP cleanup to prevent memory leaks/double-rendering in React
    };
  }, []);

  return (
    <section className={styles.wrapper} ref={containerRef}>
      {/* Persistent Background Layer spanning both sections */}
      <div className={styles.sharedBackground}></div>

      {/* Container for the overlapping sections */}
      <div className={styles.sectionsContainer}>
        
        {/* Section 1: Machine Learning */}
        <div id="machine-learning" className={`${styles.section} ${styles.mlSection}`}>
          <div className={styles.contentWrapper}>
            <h2 className="ml-flow-node">Machine Learning</h2>
            <div className={styles.cardsContainer}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`ml-flow-node ${styles.card}`}>
                  <h3>Model Node {i}</h3>
                  <p>Processing data streams...</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Neural Networks */}
        <div id="neural-networks" className={`${styles.section} ${styles.nnSection}`}>
          <div className={`nn-content ${styles.nnContent}`}>
            <h2>Neural Network</h2>
            <p className={styles.subtitle}>Deep learning visualization</p>
            <div className={styles.canvasContainer}>
              <canvas ref={canvasRef} className={styles.nnCanvas}></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
