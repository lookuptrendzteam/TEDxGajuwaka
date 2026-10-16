
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase =
  url && key ? createClient(url, key) : null;

const EVENT_DATE = new Date("2027-01-24T09:00:00+05:30");
const WHATSAPP = "919493797664";
const EMAIL = "kanthi@tedxgajuwaka.in";

type Speaker = {
  id: string | number;
  name: string;
  talk_title: string;
  bio: string | null;
  photo_url: string;
  event_year: number | null;
};

export default function Home() {
  const [timeLeft, setTimeLeft] = useState([0, 0, 0, 0]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [audience, setAudience] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [audienceMessage, setAudienceMessage] = useState("");
  const [audienceBusy, setAudienceBusy] = useState(false);

  const [nomination, setNomination] = useState({
    nominee_name: "",
    email: "",
    talk_title: "",
    idea: "",
  });
  const [nominationMessage, setNominationMessage] = useState("");
  const [nominationBusy, setNominationBusy] = useState(false);

  useEffect(() => {
    const update = () => {
      const ms = Math.max(0, EVENT_DATE.getTime() - Date.now());
      setTimeLeft([
        Math.floor(ms / 86400000),
        Math.floor((ms / 3600000) % 24),
        Math.floor((ms / 60000) % 60),
        Math.floor((ms / 1000) % 60),
      ]);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadGallery() {
      if (!supabase) {
        setGalleryError("Gallery connection is not configured.");
        setGalleryLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("speaker_gallery")
        .select("id, name, talk_title, bio, photo_url, event_year")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        setGalleryError("We couldn't load the speaker gallery just now.");
      } else {
        setSpeakers((data ?? []) as Speaker[]);
      }
      setGalleryLoading(false);
    }

    loadGallery();
    return () => {
      active = false;
    };
  }, []);

  async function submitAudience(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAudienceMessage("");

    if (!supabase) {
      setAudienceMessage("Registration is temporarily unavailable. Please contact us.");
      return;
    }

    setAudienceBusy(true);
    try {
      const { error } = await supabase
        .from("audience_registrations")
        .insert({
          full_name: audience.full_name.trim(),
          email: audience.email.trim(),
          phone: audience.phone.trim() || null,
        });

      if (error) {
        setAudienceMessage("We couldn't submit your registration. Please try again.");
        return;
      }

      setAudience({ full_name: "", email: "", phone: "" });
      setAudienceMessage("Thank you! Your interest has been recorded.");
    } catch {
      setAudienceMessage("Something went wrong. Please try again.");
    } finally {
      setAudienceBusy(false);
    }
  }

  async function submitNomination(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNominationMessage("");

    if (!supabase) {
      setNominationMessage("Nominations are temporarily unavailable. Please contact us.");
      return;
    }

    setNominationBusy(true);
    try {
      const { error } = await supabase
        .from("speaker_nominations")
        .insert({
          nominee_name: nomination.nominee_name.trim(),
          email: nomination.email.trim(),
          talk_title: nomination.talk_title.trim(),
          idea: nomination.idea.trim(),
        });

      if (error) {
        setNominationMessage("We couldn't submit your nomination. Please try again.");
        return;
      }

      setNomination({
        nominee_name: "",
        email: "",
        talk_title: "",
        idea: "",
      });
      setNominationMessage("Thank you! Your nomination has been received for review.");
    } catch {
      setNominationMessage("Something went wrong. Please try again.");
    } finally {
      setNominationBusy(false);
    }
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="tedx">
      <style jsx global>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; scroll-padding-top: 82px; background: #070707; }
        body { margin: 0; background: #070707; color: #fff; font-family: Arial, Helvetica, sans-serif; }
        a { color: inherit; text-decoration: none; }
        button, input, textarea { font: inherit; }
        button, a { -webkit-tap-highlight-color: transparent; }
        .tedx {
          --red: #eb0028;
          --red2: #ff405b;
          --muted: #aaa;
          --line: rgba(255,255,255,.13);
          background: #070707;
          overflow: hidden;
        }
        .wrap { width: min(1160px, calc(100% - 44px)); margin: 0 auto; }
        .nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(7,7,7,.88); backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--line);
        }
        .nav-inner { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; white-space: nowrap; }
        .logo span { color: var(--red); }
        .nav-links { display: flex; align-items: center; gap: 23px; font-size: 12px; font-weight: 800; color: #ddd; }
        .nav-links a:hover, .footer-links a:hover { color: var(--red2); }
        .menu-toggle { display: none; color: white; background: #151515; border: 1px solid var(--line); padding: 8px 12px; border-radius: 5px; font-size: 21px; }
        .btn {
          min-height: 48px; padding: 0 21px; display: inline-flex; align-items: center;
          justify-content: center; gap: 9px; border-radius: 5px; font-size: 12px;
          font-weight: 900; letter-spacing: .5px; border: 1px solid transparent;
          cursor: pointer; transition: transform .25s, box-shadow .25s, background .25s;
        }
        .btn:hover { transform: translateY(-3px); }
        .btn-red { color: #fff; background: var(--red); border-color: var(--red); box-shadow: 0 8px 28px rgba(235,0,40,.16); }
        .btn-red:hover { background: #c90022; box-shadow: 0 10px 32px rgba(235,0,40,.32); }
        .btn-line { border-color: #555; color: #fff; background: transparent; }
        .hero {
          min-height: 720px; position: relative; display: flex; align-items: center; isolation: isolate;
          border-bottom: 1px solid var(--line);
          background: radial-gradient(ellipse at 82% 45%, rgba(235,0,40,.23), transparent 34%),
            radial-gradient(ellipse at 10% 85%, rgba(105,0,20,.18), transparent 38%), #070707;
        }
        .hero:before {
          content: ""; position: absolute; inset: 0; z-index: -1; opacity: .14;
          background-image: linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px);
          background-size: 58px 58px;
          mask-image: linear-gradient(to bottom, black, transparent 90%);
        }
        .hero:after {
          content: "X"; position: absolute; z-index: -1; right: 4%; top: 15%;
          color: rgba(235,0,40,.09); font-size: clamp(220px, 35vw, 510px);
          line-height: 1; font-weight: 900; transform: rotate(-12deg);
          animation: xfloat 8s ease-in-out infinite;
        }
        .hero-content { padding-top: 82px; padding-bottom: 68px; animation: appear .9s ease both; }
        .kicker { color: #ff657a; font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; }
        .kicker:before { content: ""; display: inline-block; width: 8px; height: 8px; background: var(--red); border-radius: 50%; margin-right: 10px; box-shadow: 0 0 16px var(--red); }
        .hero h1 { max-width: 1000px; margin: 29px 0 22px; font-size: clamp(51px, 10vw, 118px); font-weight: 900; letter-spacing: -.085em; line-height: .91; }
        .red { color: var(--red); }
        .stroke { color: transparent; -webkit-text-stroke: 1px rgba(255,255,255,.72); }
        .hero-copy { max-width: 600px; color: #bbb; font-size: clamp(15px, 2vw, 18px); line-height: 1.9; }
        .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 29px; }
        .event-meta { display: flex; flex-wrap: wrap; gap: 30px; margin-top: 48px; padding-top: 23px; border-top: 1px solid var(--line); }
        .meta { display: grid; gap: 6px; }
        .meta small { color: #888; font-size: 9px; font-weight: 900; letter-spacing: 2px; }
        .meta strong { font-size: 13px; }
        .countdown { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 23px; }
        .clock-box { min-width: 72px; padding: 11px 13px; border: 1px solid var(--line); background: rgba(255,255,255,.035); border-radius: 5px; }
        .clock-number { font-size: 26px; font-weight: 900; font-variant-numeric: tabular-nums; }
        .clock-label { font-size: 9px; color: #999; letter-spacing: 1.5px; font-weight: 800; }
        .section { padding: 100px 0; }
        .dark { background: #0d0d0d; }
        .section-head { display: flex; align-items: end; justify-content: space-between; gap: 30px; margin-bottom: 40px; }
        .section h2 { margin: 12px 0 0; font-size: clamp(37px, 6vw, 67px); line-height: .98; letter-spacing: -.075em; }
        .intro { max-width: 510px; color: #aaa; font-size: 15px; line-height: 1.9; }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 60px; }
        .art {
          position: relative; min-height: 360px; overflow: hidden; padding: 40px; display: flex;
          flex-direction: column; justify-content: center; border: 1px solid rgba(235,0,40,.38);
          border-radius: 10px; background: radial-gradient(circle at 75% 20%, rgba(235,0,40,.36), transparent 45%), linear-gradient(140deg,#220910,#101010 68%);
        }
        .art:after { content: "2.0"; position: absolute; bottom: -40px; right: -5px; color: rgba(255,255,255,.055); font-size: 190px; font-weight: 900; letter-spacing: -15px; }
        .art small { color: #ff7b8e; font-size: 10px; letter-spacing: 2px; font-weight: 900; }
        .art strong { position: relative; z-index: 1; margin-top: 20px; font-size: clamp(45px, 6vw, 70px); line-height: .95; letter-spacing: -5px; }
        .art p { position: relative; z-index: 1; max-width: 300px; color: #bbb; line-height: 1.8; }
        .body-copy { color: #b6b6b6; font-size: 15px; line-height: 1.95; }
        .checklist { display: grid; gap: 14px; margin-top: 25px; }
        .check { display: flex; align-items: flex-start; gap: 12px; color: #eee; font-size: 13px; line-height: 1.7; }
        .check b { color: var(--red2); }
        .quote-band { padding: 66px 0; text-align: center; border-block: 1px solid var(--line); background: radial-gradient(ellipse at center,rgba(235,0,40,.12),transparent 65%),#0b0b0b; }
        .quote-mark { color: var(--red); font-family: Georgia,serif; font-size: 75px; line-height: .8; }
        .quote-text { max-width: 850px; margin: 15px auto 20px; font-size: clamp(25px, 4.4vw, 46px); font-weight: 800; line-height: 1.22; letter-spacing: -1.5px; }
        .quote-credit { color: #999; font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
        .team-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 17px; margin-top: 30px; }
        .team-card { padding: 23px; background: #131313; border: 1px solid var(--line); border-left: 3px solid var(--red); border-radius: 6px; transition: transform .25s,border-color .25s; }
        .team-card:hover { transform: translateY(-4px); border-color: rgba(235,0,40,.65); }
        .team-card small { color: #ff657a; font-size: 9px; font-weight: 900; letter-spacing: 2px; }
        .team-card h3 { margin: 11px 0 5px; font-size: 25px; letter-spacing: -1px; }
        .team-card p { margin: 0; color: #999; font-size: 12px; }
        .gallery { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 20px; }
        .speaker { overflow: hidden; border: 1px solid var(--line); border-radius: 9px; background: #141414; transition: transform .3s,border-color .3s; }
        .speaker:hover { transform: translateY(-6px); border-color: rgba(235,0,40,.7); }
        .photo-wrap { aspect-ratio: 4/4.3; background: radial-gradient(circle at center,#351019,#141414 72%); overflow: hidden; }
        .photo { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .4s; }
        .speaker:hover .photo { transform: scale(1.04); }
        .speaker-info { padding: 19px; }
        .year { color: #ff687e; font-size: 9px; letter-spacing: 2px; font-weight: 900; }
        .speaker-info h3 { font-size: 22px; margin: 10px 0 7px; }
        .speaker-info p { color: #aaa; font-size: 13px; line-height: 1.7; margin: 0; overflow-wrap: anywhere; }
        .empty { grid-column: 1/-1; border: 1px dashed #393939; padding: 30px; color: #aaa; line-height: 1.8; }
        .note { margin-top: 20px; color: #858585; font-size: 11px; line-height: 1.8; }
        .forms { display: grid; grid-template-columns: 1fr 1fr; gap: 23px; align-items: start; }
        .form-card { padding: 29px; background: linear-gradient(145deg,#171717,#0e0e0e); border: 1px solid var(--line); border-radius: 10px; }
        .form-card h3 { margin: 12px 0; font-size: 31px; letter-spacing: -1.5px; }
        .form-card > p { color: #aaa; font-size: 13px; line-height: 1.8; margin-bottom: 23px; }
        .label { display: block; margin-bottom: 15px; font-size: 12px; font-weight: 800; color: #ddd; }
        .field { width: 100%; min-height: 49px; display: block; margin-top: 8px; padding: 13px 14px; color: white; background: #090909; border: 1px solid #3a3a3a; border-radius: 5px; outline: none; font-size: 16px; }
        .field:focus { border-color: var(--red); box-shadow: 0 0 0 3px rgba(235,0,40,.12); }
        .field::placeholder { color: #777; }
        textarea.field { min-height: 135px; resize: vertical; }
        .full { width: 100%; }
        .message { margin-top: 15px; padding: 12px; border-radius: 5px; background: rgba(255,255,255,.05); font-size: 12px; color: #eee; line-height: 1.7; overflow-wrap: anywhere; }
        .message:empty { display: none; }
        .rules { margin: 20px 0; padding: 17px; background: rgba(235,0,40,.07); border: 1px solid rgba(235,0,40,.35); border-radius: 6px; }
        .rules strong { display: block; color: #ff6c81; font-size: 11px; letter-spacing: 1.5px; margin-bottom: 8px; }
        .rules p { margin: 0; color: #ccc; font-size: 12px; line-height: 1.8; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 30px; }
        .contact-card { padding: 23px; background: #141414; border: 1px solid var(--line); border-radius: 8px; overflow-wrap: anywhere; }
        .contact-card small { color: #ff657a; font-size: 10px; font-weight: 900; letter-spacing: 2px; }
        .contact-card a { display: block; margin-top: 10px; font-size: clamp(14px,2vw,19px); font-weight: 800; }
        .cta { padding: 65px 0; border-block: 1px solid var(--line); background: radial-gradient(ellipse at 80% 50%,rgba(235,0,40,.2),transparent 45%),#101010; }
        .cta-inner { display: flex; align-items: center; justify-content: space-between; gap: 25px; }
        .cta h2 { margin: 12px 0 0; font-size: clamp(34px,5vw,55px); line-height: 1.04; letter-spacing: -3px; }
        .footer { padding: 40px 0; background: #070707; }
        .footer-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px; }
        .footer-copy { color: #858585; font-size: 11px; line-height: 1.9; }
        .footer-links { display: flex; flex-wrap: wrap; gap: 17px; font-size: 11px; color: #bbb; }
        .error { color: #ff9aa8; font-size: 12px; }
        @keyframes appear { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes xfloat { 0%,100% { transform: translateY(0) rotate(-12deg); } 50% { transform: translateY(18px) rotate(-7deg); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(235,0,40,.18); } 50% { box-shadow: 0 0 0 8px rgba(235,0,40,0); } }
        @media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration: .01ms!important; transition-duration: .01ms!important; scroll-behavior: auto!important; } }
        @media (max-width: 850px) {
          .nav-links { gap: 12px; }
          .about-grid { gap: 28px; }
          .gallery { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .forms { grid-template-columns: 1fr; }
        }
        @media (max-width: 650px) {
          .wrap { width: calc(100% - 32px); }
          .nav-inner { min-height: 66px; }
          .logo { font-size: 19px; }
          .menu-toggle { display: block; }
          .nav-links { display: none; position: absolute; top: 66px; left: 0; right: 0; padding: 12px 16px 18px; flex-direction: column; align-items: stretch; gap: 0; background: #0b0b0b; border-bottom: 1px solid var(--line); }
          .nav-links.open { display: flex; }
          .nav-links a { padding: 13px 5px; }
          .nav-links .btn { margin-top: 8px; }
          .hero { min-height: auto; }
          .hero-content { padding-top: 70px; padding-bottom: 50px; }
          .hero h1 { font-size: clamp(45px,12vw,74px); }
          .hero-copy { font-size: 15px; }
          .event-meta { gap: 20px; margin-top: 32px; }
          .meta strong { font-size: 11px; }
          .clock-box { min-width: 61px; padding: 9px; }
          .clock-number { font-size: 22px; }
          .section { padding: 68px 0; }
          .section-head { display: block; margin-bottom: 27px; }
          .intro { font-size: 14px; }
          .about-grid { grid-template-columns: 1fr; gap: 25px; }
          .art { min-height: 280px; padding: 27px; }
          .team-grid { grid-template-columns: 1fr; }
          .gallery { grid-template-columns: 1fr; }
          .photo-wrap { aspect-ratio: 4/3.4; }
          .form-card { padding: 22px 17px; }
          .cta-inner { align-items: flex-start; flex-direction: column; }
          .cta h2 { letter-spacing: -1.5px; }
          .footer-inner { align-items: flex-start; flex-direction: column; }
          .contact-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="nav">
        <div className="wrap nav-inner">
          <a className="logo" href="#home" onClick={closeMenu}>
            TED<span>x</span>GAJUWAKA
          </a>
          <button
            className="menu-toggle"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "×" : "☰"}
          </button>
          <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
            <a href="#about" onClick={closeMenu}>ABOUT</a>
            <a href="#team" onClick={closeMenu}>ORGANIZERS</a>
            <a href="#speakers" onClick={closeMenu}>SPEAKERS</a>
            <a href="#nominate" onClick={closeMenu}>NOMINATE</a>
            <a className="btn btn-red" href="#register" onClick={closeMenu}>JOIN THE AUDIENCE ↗</a>
          </nav>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="wrap hero-content">
          <div className="kicker">Independently organized TED event</div>
          <h1>
            THE POWER
            <br />
            OF <span className="red">PERSPECTIVE.</span>
            <br />
            <span className="stroke">PERSPECTIVE</span> <span className="red">2.0</span>
          </h1>
          <p className="hero-copy">
            One new perspective can change the way we see everything.
            Challenge assumptions, explore original ideas and join a
            conversation that looks beyond the ordinary.
          </p>
          <div className="actions">
            <a className="btn btn-red" href="#register">REGISTER YOUR INTEREST ↗</a>
            <a className="btn btn-line" href="#nominate">NOMINATE AN IDEA ↗</a>
          </div>
          <div className="event-meta">
            <div className="meta"><small>UPCOMING EVENT</small><strong>24 JANUARY 2027</strong></div>
            <div className="meta"><small>LOCATION</small><strong>VISAKHAPATNAM, INDIA</strong></div>
            <div className="meta"><small>PREVIOUS EVENT</small><strong>FEBRUARY 2026</strong></div>
          </div>
          <div className="countdown" aria-label="Countdown to the event">
            {["DAYS", "HOURS", "MINUTES", "SECONDS"].map((label, i) => (
              <div className="clock-box" key={label}>
                <div className="clock-number">{String(timeLeft[i]).padStart(2, "0")}</div>
                <div className="clock-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="about">
        <div className="wrap about-grid">
          <div className="art">
            <small>TEDxGAJUWAKA · THE NEXT CHAPTER</small>
            <strong>SEE IT<br /><span className="red">DIFFERENT.</span></strong>
            <p>New viewpoints. Meaningful conversations. Ideas worth exploring.</p>
          </div>
          <div>
            <div className="kicker">A new way of seeing</div>
            <h2>What if you saw it <span className="red">differently?</span></h2>
            <p className="body-copy">
              TEDxGajuwaka brings people together to share ideas, experiences
              and perspectives that invite us to think deeper. After our
              February 2026 event, we are preparing the next chapter:
              The Power of Perspective 2.0, on 24 January 2027.
            </p>
            <p className="body-copy">
              We welcome thoughtful, original ideas that offer a meaningful
              perspective on the world—not just a speech, but an idea worth
              sharing.
            </p>
            <div className="checklist">
              <div className="check"><b>✦</b><span>Ideas that challenge assumptions and open new conversations.</span></div>
              <div className="check"><b>✦</b><span>Stories grounded in insight, experience, discovery or evidence.</span></div>
              <div className="check"><b>✦</b><span>A platform for ideas—not for personal or commercial promotion.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="quote-band">
        <div className="wrap">
          <div className="quote-mark">“</div>
          <div className="quote-text">
            A different question can open a door that certainty keeps closed.
          </div>
          <div className="quote-credit">TEDxGajuwaka · An original event thought</div>
        </div>
      </section>

      <section className="section dark" id="team">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="kicker">The people behind the event</div>
              <h2>Meet the <span className="red">organizers.</span></h2>
            </div>
            <p className="intro">
              The team bringing The Power of Perspective 2.0 to Visakhapatnam.
            </p>
          </div>
          <div className="team-grid">
            <article className="team-card">
              <small>ORGANIZER · TEDxGAJUWAKA</small>
              <h3>Kanthi Rekha</h3>
              <p>Organizer</p>
            </article>
            <article className="team-card">
              <small>CO-ORGANIZER · TEDxGAJUWAKA</small>
              <h3>Sowndarya</h3>
              <p>Co-Organizer</p>
            </article>
          </div>
        </div>
      </section>

      <section className="quote-band">
        <div className="wrap">
          <div className="quote-mark">“</div>
          <div className="quote-text">
            The most interesting ideas do more than give answers. They change what we ask.
          </div>
          <div className="quote-credit">The Power of Perspective 2.0</div>
        </div>
      </section>

      <section className="section" id="speakers">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="kicker">The journey so far</div>
              <h2>Ideas leave <span className="red">a mark.</span></h2>
            </div>
            <p className="intro">
              Revisit speakers and talks from previous events. Profiles
              published through the admin portal are loaded from Supabase.
            </p>
          </div>
          <div className="gallery">
            {galleryLoading ? (
              <div className="empty">Loading speaker gallery…</div>
            ) : speakers.length ? (
              speakers.map((speaker) => (
                <article className="speaker" key={speaker.id}>
                  <div className="photo-wrap">
                    {speaker.photo_url ? (
                      <img className="photo" src={speaker.photo_url} alt={`Photo of ${speaker.name}`} loading="lazy" />
                    ) : (
                      <div className="photo" style={{ display: "grid", placeItems: "center", fontSize: 60 }}>
                        {speaker.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="speaker-info">
                    <div className="year">
                      TEDxGAJUWAKA{speaker.event_year ? ` · ${speaker.event_year}` : ""}
                    </div>
                    <h3>{speaker.name}</h3>
                    <p>{speaker.talk_title}</p>
                    {speaker.bio && <p style={{ marginTop: 10 }}>{speaker.bio}</p>}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty">
                {galleryError || "Previous-event speaker profiles will appear here when they have been successfully saved in the admin portal."}
              </div>
            )}
          </div>
          <p className="note">
            Speaker photos appear here after the image upload and speaker record
            are both saved successfully. If a photo is missing, check the admin
            upload status and Supabase permissions.
          </p>
        </div>
      </section>

      <section className="quote-band">
        <div className="wrap">
          <div className="quote-mark">“</div>
          <div className="quote-text">
            Bring an idea that makes people pause, think, and see something new.
          </div>
          <div className="quote-credit">Speaker nominations · 2027</div>
        </div>
      </section>

      <section className="section dark" id="register">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="kicker">Be part of the conversation</div>
              <h2>Your next <span className="red">perspective</span> starts here.</h2>
            </div>
            <p className="intro">
              Register your interest in attending TEDxGajuwaka 2027 or
              nominate an idea for consideration. We look forward to hearing
              from curious minds.
            </p>
          </div>

          <div className="forms">
            <div className="form-card">
              <div className="kicker">Audience registration</div>
              <h3>Join the audience.</h3>
              <p>
                Share your contact details to register your interest in the
                upcoming event. This form records interest and is not a ticket
                confirmation.
              </p>
              <form onSubmit={submitAudience}>
                <label className="label">Full name
                  <input className="field" autoComplete="name" value={audience.full_name} onChange={(e) => setAudience({ ...audience, full_name: e.target.value })} placeholder="Your full name" required />
                </label>
                <label className="label">Email address
                  <input className="field" type="email" autoComplete="email" value={audience.email} onChange={(e) => setAudience({ ...audience, email: e.target.value })} placeholder="you@example.com" required />
                </label>
                <label className="label">WhatsApp / phone number (optional)
                  <input className="field" type="tel" autoComplete="tel" value={audience.phone} onChange={(e) => setAudience({ ...audience, phone: e.target.value })} placeholder="Your contact number" />
                </label>
                <button className="btn btn-red full" type="submit" disabled={audienceBusy}>
                  {audienceBusy ? "SUBMITTING…" : "REGISTER YOUR INTEREST ↗"}
                </button>
                <div className="message" role="status" aria-live="polite">{audienceMessage}</div>
              </form>
            </div>

            <div className="form-card" id="nominate">
              <div className="kicker">Speaker nominations</div>
              <h3>Bring an idea worth sharing.</h3>
              <p>
                Nominate a person with a clear, original idea relevant to
                The Power of Perspective 2.0. Nominations are reviewed; submission
                does not guarantee speaker selection.
              </p>

              <div className="rules">
                <strong>PLEASE READ · TALK GUIDELINES</strong>
                <p>
                  We are looking for original ideas—not motivational speeches,
                  personal-brand promotion, business or product advertisements,
                  sales pitches, or talks primarily designed to promote the
                  speaker or an organization. Ideas should offer insight,
                  evidence, discovery or a fresh perspective. All proposals
                  are subject to TEDx content guidelines and organizer review.
                </p>
              </div>

              <form onSubmit={submitNomination}>
                <label className="label">Nominee full name
                  <input className="field" value={nomination.nominee_name} onChange={(e) => setNomination({ ...nomination, nominee_name: e.target.value })} placeholder="Nominees name" required />
                </label>
                <label className="label">Contact email
                  <input className="field" type="email" value={nomination.email} onChange={(e) => setNomination({ ...nomination, email: e.target.value })} placeholder="you@example.com" required />
                </label>
                <label className="label">Proposed talk title
                  <input className="field" value={nomination.talk_title} onChange={(e) => setNomination({ ...nomination, talk_title: e.target.value })} placeholder="Title of the idea" required />
                </label>
                <label className="label">Explain the core idea (minimum 20 characters)
                  <textarea className="field" minLength={20} value={nomination.idea} onChange={(e) => setNomination({ ...nomination, idea: e.target.value })} placeholder="What is the original idea? What makes it worth sharing?" required />
                </label>
                <button className="btn btn-red full" type="submit" disabled={nominationBusy}>
                  {nominationBusy ? "SUBMITTING…" : "SUBMIT IDEA FOR REVIEW ↗"}
                </button>
                <div className="message" role="status" aria-live="polite">{nominationMessage}</div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="kicker">Get in touch</div>
              <h2>Let's <span className="red">connect.</span></h2>
            </div>
            <p className="intro">
              Questions about the event, audience registration or speaker
              nominations? Contact the TEDxGajuwaka organizing team.
            </p>
          </div>
          <div className="contact-grid">
            <div className="contact-card">
              <small>WHATSAPP / CONTACT</small>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
                +91 94937 97664 ↗
              </a>
            </div>
            <div className="contact-card">
              <small>EMAIL THE ORGANIZER</small>
              <a href={`mailto:${EMAIL}`}>{EMAIL} ↗</a>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap cta-inner">
          <div>
            <div className="kicker">24 January 2027 · Visakhapatnam</div>
            <h2>One idea can change <span className="red">everything.</span></h2>
          </div>
          <a className="btn btn-red" href="#register">BE PART OF TEDxGAJUWAKA ↗</a>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div>
            <a className="logo" href="#home">TED<span>x</span>GAJUWAKA</a>
            <div className="footer-copy">
              The Power of Perspective 2.0<br />
              Visakhapatnam, Andhra Pradesh, India<br />
              Organizer: Kanthi Rekha · Co-Organizer: Sowndarya
            </div>
          </div>
          <div className="footer-links">
            <a href="#about">About</a>
            <a href="#team">Organizers</a>
            <a href="#speakers">Speakers</a>
            <a href="#register">Register</a>
            <a href="#nominate">Nominate</a>
            <a href="/admin">Admin</a>
          </div>
          <div className="footer-copy">
            Independently organized TED event.<br />
            TEDx is a program of TED.
          </div>
        </div>
      </footer>
    </main>
  );
}


