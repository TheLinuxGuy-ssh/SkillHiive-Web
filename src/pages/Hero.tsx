// import HUD from "@/components/HUD";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import shVid from "@/assets/sh.mp4";

export default function Hero() {
  const [easterVisible, setEasterVisible] = useState(false);

  const ctaRef = useRef<HTMLButtonElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
  }, []);

  useEffect(() => {
    const revealEls = document.querySelectorAll(
      ".reveal-text, .reveal-item, .reveal-line",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ? parseInt(el.dataset.delay) : 0;

            setTimeout(() => {
              el.classList.add("in-view");
            }, delay);

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 },
    );

    revealEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (easterVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [easterVisible]);






  const handleCtaMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ctaRef.current) return;

    const rect = ctaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;

    ctaRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  };

  const resetCta = () => {
    if (!ctaRef.current) return;

    ctaRef.current.style.transform = "translate(0px, 0px)";
  };

  return (
    <>
      <div className="noise" aria-hidden="true" />
      <main>
        <section className="hero relative min-h-dvh">
          <video className="absolute top-0 left-0 w-full object-cover opacity-100 flip scale-x-100" src={shVid} autoPlay muted loop />
          <div className="absolute inset-0 z-10 h-full pointer-events-none bg-[radial-gradient(circle,_transparent_20%,_rgba(0,0,0,0.85)_100%)]"></div>

          <div
            className="hero-manifesto reveal-item !z-40"
            data-delay="600"
            aria-hidden="false"
          >
            <div className="hero-manifesto-glyph" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <ul className="hero-manifesto-lines">
              <li className="reveal-line" data-delay="700">No algorithms</li>
              <li className="reveal-line" data-delay="850">No leaderboards</li>
              <li className="reveal-line" data-delay="1000">No performance to keep up</li>
            </ul>
            <span className="hero-manifesto-foot">— built for the work, not the feed</span>
                          <div
                className="ticket-zone reveal-text hover:scale-[1.025] transition-ui"
                data-delay="700"
              >
                <button
                  ref={ctaRef}
                  className="cta-btn"
                  onMouseMove={handleCtaMove}
                  onMouseLeave={resetCta}
                  onClick={() => navigate("/register")}
                >
                  <span className="btn-text">JOIN US</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
          </div>

          <div className="hero-content !z-20">

            <div className="hero-cell justify-end px-2 h-full">
              <div className="hero-meta">
                <div className="status-dot"></div>
                <span className="reveal-text">FROM THE PEACEFUL INTERNET</span>
              </div>

              <h1 className="hero-title">
                <span className="title-seg reveal-line mix-blend-screen" data-delay="0">
                  SkillHiive
                </span>
              </h1>
            </div>
            {/* <div className="hero-cell" data-delay="400">
              <HUD />
            </div> */}
          </div>

          <div className="scroll-hint reveal-text" data-delay="900">
            <span className="scroll-line"></span>
            <span className="scroll-label">SCROLL</span>
          </div>
        </section>
        {/* 
        <section className="artists" id="artists">
          <p className="section-label reveal-text">Featured Artists</p>

          <ul className="artist-list">
            {artists.map((artist, i) => (
              <li
                key={artist.name}
                className="artist-item reveal-item"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="artist-name">{artist.name}</span>
                <span className="artist-time">{artist.time}</span>
              </li>
            ))}
          </ul>
        </section> */}
        {/* 
        <section className="manifesto">
          <blockquote className="manifesto-text reveal-text">
            “We build no stages.
            <br />
            We cast no spotlights.
            <br />
            Only sound moving
            <br />
            through bodies in the dark.”
          </blockquote>
        </section> */}
      </main>

      <div className={`easter-egg ${easterVisible ? "visible" : ""}`}>
        <div className="egg-content">
          <p className="egg-greeting">You found us early.</p>

          <p className="egg-code">
            Use code <strong>VOID</strong> for early access.
          </p>

          <button className="egg-close" onClick={() => setEasterVisible(false)}>
            × close
          </button>
        </div>
      </div>
    </>
  );
}