// Hero.tsx

import HUD from "@/components/HUD";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

export default function Hero() {
  // const [ticketCount, setTicketCount] = useState(247);
  const [easterVisible, setEasterVisible] = useState(false);

  const ctaRef = useRef<HTMLButtonElement | null>(null);
  // const logoClicks = useRef(0);
  // const logoTimer = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // let timeout: number;
    // const decrementTicket = () => {
    //   setTicketCount((prev) => {
    //     if (prev <= 0) return prev;
    //     return prev - 1;
    //   });
    //   timeout = window.setTimeout(
    //     decrementTicket,
    //     4000 + Math.random() * 10000
    //   );
    // };
    // timeout = window.setTimeout(decrementTicket, 3000);
    // return () => clearTimeout(timeout);
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

  // const handleLogoClick = () => {
  //   logoClicks.current += 1;

  //   const logo = document.getElementById("logoMark");

  //   if (logo) {
  //     logo.classList.remove("pulse");
  //     void logo.offsetWidth;
  //     logo.classList.add("pulse");
  //   }

  //   if (logoTimer.current) {
  //     clearTimeout(logoTimer.current);
  //   }

  //   if (logoClicks.current >= 3) {
  //     logoClicks.current = 0;
  //     setEasterVisible(true);
  //   } else {
  //     logoTimer.current = window.setTimeout(() => {
  //       logoClicks.current = 0;
  //     }, 1500);
  //   }
  // };

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
        <section className="hero">
          <div className="hero-content">
            <div className="hero-cell px-10">
              <div className="hero-meta">
                <div className="status-dot"></div>
                <span className="reveal-text"> BETA TESTING</span>
              </div>

              <h1 className="hero-title">
                <span className="title-seg reveal-line" data-delay="0">
                  SkillHiive
                </span>
              </h1>

              <p className="hero-sub reveal-text" data-delay="500">
                No algorithms. No performance system. <br />
                Just real people, real connections, real work.
                <br />
                Without burnouts
              </p>

              <div
                className="ticket-zone reveal-text hover:scale-[1.025] transition-ui"
                data-delay="700"
              >
                <button
                  ref={ctaRef}
                  className="cta-btn"
                  onMouseMove={handleCtaMove}
                  onMouseLeave={resetCta}
                  onClick={() => navigate("/login")}
                >
                  <span className="btn-text">JOIN BETA TESTFLIGHT</span>
                  <span className="btn-arrow">→</span>
                </button>
              </div>
            </div>

            <div className="hero-cell" data-delay="400">
              <HUD />
            </div>
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
