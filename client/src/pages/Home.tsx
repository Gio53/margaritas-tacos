// ============================================================
// MARGARITAS TACOS — Home Page
// Design: Warm Hacienda / Rustic Elegance
// Colors: Terracotta (#C4622D), Adobe White (#FFF8F0), Sunset Gold (#E8A838), Espresso (#2C1810)
// Fonts: Playfair Display (display), Oswald (headers), Lato (body)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { menuCategories } from "@/data/menuData";
import { Phone, MapPin, Clock, ChevronDown, Menu, X, Leaf } from "lucide-react";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/hzTDuwj6alGRsnPs2KGFlf/sandbox/ASZe5vfvUKCslq96kKEdNS-img-1_1772065202000_na1fn_aGVyby1iYW5uZXI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvaHpURHV3ajZhbEdSc25QczJLR0ZsZi9zYW5kYm94L0FTWmU1dmZ2VUtDc2xxOTZrS0VkTlMtaW1nLTFfMTc3MjA2NTIwMjAwMF9uYTFmbl9hR1Z5YnkxaVlXNXVaWEkuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=iFbrz6F570D8AURC2LEV-YxZHxoNgNrJGHm0HuTjmkzrSlyOnqpaJwZgJT5VOVz80A8HuwBo0D~TvnF8EzuYHLJr0beYl~eJ0OaQXVkv3XNLUumwSN2V3hPUXaR~2mTVBXQBQ5p5CFX5iwVkQWNFQss9bphxK104hG6HJztOF-z4uMeyh4o1fBGtNaIbTmZF87Z~OdNwfwXEakzG~IoJhO66lm0z6T8CeMzcvJk84zF1NrDe9JYExl7KrzBn0-mO83NDp1OdVptP-v6lYf8tjT9Bb5ugZwdtMqvc-mZ~tYIRhwG572d6UQh4S1XHHZk3dQVsM0iDI0cWMEYkx5ADpw__";
const TACOS_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/hzTDuwj6alGRsnPs2KGFlf/sandbox/ASZe5vfvUKCslq96kKEdNS-img-3_1772065188000_na1fn_dGFjb3MtcGxhdGU.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvaHpURHV3ajZhbEdSc25QczJLR0ZsZi9zYW5kYm94L0FTWmU1dmZ2VUtDc2xxOTZrS0VkTlMtaW1nLTNfMTc3MjA2NTE4ODAwMF9uYTFmbl9kR0ZqYjNNdGNHeGhkR1UuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Bn7KaAvxJce1XhnMBTuYENe0vq9ybE5fce1c~Rlb5nnKktjMLukbO4q5IRqSMj6U3MIKqr2t54Rpy3VMRk~7~ebMO~0S7oSEIvhvX~yBfD08bs0nD4YV2SEzHGhcYfB4PHYy99g1Bi81F6ILA5aZMf-puG2vUtdpqqzuWzzz2QTTpcjLPmvSPTpiO9LvcrGtSbKzm4R9oDd3w0pGesx959BKhHLq-lD9rrbqPPMQQL3C5jP2TlBb0fo9u1dpXIaWYhCHFoj5hIsmRyZCPYt0PBWwR1zK6P6f0zVTLnzC3zzKI8Pq0zNtadH8YPq07pJyCF96LowjYt4YM4Kjdwtf~A__";
const NACHOS_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/hzTDuwj6alGRsnPs2KGFlf/sandbox/ASZe5vfvUKCslq96kKEdNS-img-4_1772065193000_na1fn_bmFjaG9zLXBsYXRl.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvaHpURHV3ajZhbEdSc25QczJLR0ZsZi9zYW5kYm94L0FTWmU1dmZ2VUtDc2xxOTZrS0VkTlMtaW1nLTRfMTc3MjA2NTE5MzAwMF9uYTFmbl9ibUZqYUc5ekxYQnNZWFJsLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=WzTfJN4mIbjkuOAcsoXNKM-vPPgrqR6jUj5JEgPqtJqluLFa~HxNy5Dx4Jgp03rXqIhpkYZDALgFKpgvzJ57B-azKdMZ5VgKFPkcZK7Wy-pjADq78QTe6E6XCxn8YxKMWFi2l0rClclSBznZ3S~N7W7jfOK0cxg44QZpp~xWM8TwiTYGoMxY~jeZQkV~6tpGtOqBRM-P4qqE~btLre3as9C2rUjQiKOmOyWY4vkuPkeizZ-Sf2zIaGG5~n5Fg-Whm8mJcprW~94lQuZ3SKh0n3yZTpMnfUZT84ncnhh7IyGC6pLoW1Dn8Rac0k9gfB5de3jdAewbDLUO53dVdTwY4A__";

// Nav items for menu categories
const NAV_CATEGORIES = [
  { id: "mexican-street-tacos", label: "Street Tacos" },
  { id: "tostadas", label: "Tostadas" },
  { id: "chilaquiles", label: "Chilaquiles" },
  { id: "rice-bowls", label: "Rice Bowls" },
  { id: "burrito", label: "Burritos" },
  { id: "quesadillas", label: "Quesadillas" },
  { id: "3-american-tacos", label: "American Tacos" },
  { id: "mexican-nachos", label: "Mexican Nachos" },
  { id: "torta", label: "Torta" },
  { id: "flautas", label: "Flautas" },
  { id: "wet-burrito", label: "Wet Burrito" },
  { id: "nachos", label: "Nachos" },
  { id: "enchiladas", label: "Enchiladas" },
];

function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState<string>(ids[0]);
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [ids]);
  return activeId;
}

export default function Home() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const activeSection = useScrollSpy(NAV_CATEGORIES.map((c) => c.id));
  const menuNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll active menu nav item into view
  useEffect(() => {
    if (!menuNavRef.current) return;
    const activeBtn = menuNavRef.current.querySelector(`[data-id="${activeSection}"]`) as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 130;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF8F0", fontFamily: "'Lato', sans-serif" }}>

      {/* ── TOP HEADER ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: headerScrolled ? "rgba(44, 24, 16, 0.97)" : "rgba(44, 24, 16, 0.92)",
          backdropFilter: "blur(8px)",
          boxShadow: headerScrolled ? "0 2px 20px rgba(0,0,0,0.3)" : "none",
        }}
      >
        <div className="container">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <a href="#hero" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex flex-col leading-none">
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 800, color: "#E8A838", lineHeight: 1 }}>
                Margaritas
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "#FFF8F0", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                Tacos
              </span>
            </a>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection("about"); }}
                style={{ color: "#FFF8F0", fontFamily: "'Lato', sans-serif", fontSize: "0.9rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, opacity: 0.9 }}
                className="hover:opacity-100 transition-opacity">About</a>
              <a href="#menu" onClick={(e) => { e.preventDefault(); scrollToSection("menu-section"); }}
                style={{ color: "#FFF8F0", fontFamily: "'Lato', sans-serif", fontSize: "0.9rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, opacity: 0.9 }}
                className="hover:opacity-100 transition-opacity">Menu</a>
              <a href="#hours" onClick={(e) => { e.preventDefault(); scrollToSection("hours"); }}
                style={{ color: "#FFF8F0", fontFamily: "'Lato', sans-serif", fontSize: "0.9rem", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, opacity: 0.9 }}
                className="hover:opacity-100 transition-opacity">Hours</a>
              <a href="tel:5164322119"
                className="flex items-center gap-2 px-4 py-2 rounded transition-colors"
                style={{ backgroundColor: "#C4622D", color: "white", fontFamily: "'Oswald', sans-serif", fontWeight: 600, letterSpacing: "0.05em" }}>
                <Phone size={14} />
                (516) 432-2119
              </a>
            </nav>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded"
              style={{ color: "#FFF8F0" }}
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div style={{ backgroundColor: "rgba(44, 24, 16, 0.98)", borderTop: "1px solid rgba(232,168,56,0.3)" }}>
            <div className="container py-4 flex flex-col gap-3">
              {[
                { label: "About", id: "about" },
                { label: "Menu", id: "menu-section" },
                { label: "Hours & Location", id: "hours" },
              ].map((item) => (
                <button key={item.id} onClick={() => scrollToSection(item.id)}
                  style={{ color: "#FFF8F0", fontFamily: "'Lato', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left", padding: "0.5rem 0" }}>
                  {item.label}
                </button>
              ))}
              <a href="tel:5164322119"
                className="flex items-center gap-2 px-4 py-2 rounded w-fit"
                style={{ backgroundColor: "#C4622D", color: "white", fontFamily: "'Oswald', sans-serif", fontWeight: 600 }}>
                <Phone size={14} />
                (516) 432-2119
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden" style={{ paddingTop: "64px" }}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Authentic Mexican Tacos" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(44,24,16,0.82) 0%, rgba(44,24,16,0.55) 50%, rgba(44,24,16,0.3) 100%)" }} />
        </div>

        {/* Hero content */}
        <div className="container relative z-10 py-20">
          <div className="max-w-2xl">
            {/* Allergy warning */}
            <div className="mb-6 p-3 rounded text-xs font-bold" style={{ backgroundColor: "rgba(255,255,0,0.15)", border: "1px solid rgba(255,255,0,0.4)", color: "#FFE566", maxWidth: "480px" }}>
              CONSUMING RAW OR UNDERCOOKED MEATS, POULTRY, SEAFOOD, SHELLFISH, OR EGGS MAY INCREASE YOUR RISK OF FOODBORNE ILLNESS, ESPECIALLY IF YOU HAVE CERTAIN MEDICAL CONDITIONS.
              <span className="block mt-1" style={{ color: "#FFD700" }}>PLEASE TELL A STAFF MEMBER IF YOU HAVE A FOOD ALLERGY</span>
            </div>

            <p style={{ fontFamily: "'Oswald', sans-serif", color: "#E8A838", fontSize: "1rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Authentic Mexican Street Food
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(3rem, 8vw, 5.5rem)", fontWeight: 800, lineHeight: 1.05, marginBottom: "1.5rem" }}>
              Margaritas<br />
              <span style={{ color: "#E8A838", fontStyle: "italic" }}>Tacos</span>
            </h1>
            <p style={{ color: "rgba(255,248,240,0.85)", fontSize: "1.15rem", fontFamily: "'Lato', sans-serif", fontWeight: 300, marginBottom: "2.5rem", maxWidth: "420px", lineHeight: 1.7 }}>
              Handcrafted Mexican street food made with authentic recipes and the freshest ingredients — right in Island Park, NY.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => scrollToSection("menu-section")}
                className="px-8 py-3 rounded font-bold transition-all hover:scale-105"
                style={{ backgroundColor: "#C4622D", color: "white", fontFamily: "'Oswald', sans-serif", fontSize: "1rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                View Full Menu
              </button>
              <Link href="/order"
                className="px-8 py-3 rounded font-bold transition-all hover:scale-105 flex items-center gap-2"
                style={{ backgroundColor: "transparent", border: "2px solid #E8A838", color: "#E8A838", fontFamily: "'Oswald', sans-serif", fontSize: "1rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                <Phone size={16} />
                Order Now
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{ color: "rgba(255,248,240,0.6)" }}>
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Scroll</span>
          <ChevronDown size={20} className="animate-bounce" />
        </div>
      </section>

      {/* ── INFO BAR ── */}
      <div style={{ backgroundColor: "#C4622D" }}>
        <div className="container py-3">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a href="tel:5164322119" className="flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: "white", fontFamily: "'Oswald', sans-serif", fontWeight: 600, letterSpacing: "0.05em" }}>
              <Phone size={15} />
              (516) 432-2119
            </a>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
            <a href="https://maps.google.com/?q=4549+Austin+Blvd+Island+Park+NY" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: "white", fontFamily: "'Lato', sans-serif", fontWeight: 400 }}>
              <MapPin size={15} />
              4549 Austin Blvd, Island Park, NY
            </a>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
            <div className="flex items-center gap-2" style={{ color: "white", fontFamily: "'Lato', sans-serif", fontWeight: 400 }}>
              <Clock size={15} />
              Tues–Thurs & Sun: 2PM–9PM &nbsp;|&nbsp; Fri–Sat: 2PM–10PM
            </div>
          </div>
        </div>
      </div>

      {/* ── ABOUT SECTION ── */}
      <section id="about" className="py-20" style={{ backgroundColor: "#FFF8F0" }}>
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p style={{ fontFamily: "'Oswald', sans-serif", color: "#C4622D", fontSize: "0.85rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                Our Story
              </p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1.5rem" }}>
                Authentic Flavors,<br />
                <span style={{ color: "#C4622D", fontStyle: "italic" }}>Straight from the Street</span>
              </h2>
              <p style={{ color: "#5a3a2a", fontFamily: "'Lato', sans-serif", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "1.25rem" }}>
                At Margaritas Tacos, every dish is crafted with the same passion and authenticity that defines true Mexican street food. From our hand-pressed corn tortillas to our slow-braised birria, we bring the vibrant flavors of Mexico directly to Island Park, NY.
              </p>
              <p style={{ color: "#5a3a2a", fontFamily: "'Lato', sans-serif", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "2rem" }}>
                Whether you're craving classic street tacos, loaded nachos, or our signature wet burrito, every plate is made fresh to order with the finest ingredients.
              </p>
              {/* Feature badges */}
              <div className="flex flex-wrap gap-3">
                {["Fresh Ingredients", "Authentic Recipes", "Made to Order", "Family Owned"].map((tag) => (
                  <span key={tag} className="px-4 py-1.5 rounded-full text-sm font-bold"
                    style={{ backgroundColor: "rgba(196,98,45,0.1)", color: "#C4622D", border: "1px solid rgba(196,98,45,0.3)", fontFamily: "'Lato', sans-serif" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden" style={{ height: "260px", boxShadow: "0 8px 32px rgba(44,24,16,0.18)" }}>
                <img src={TACOS_IMG} alt="Birria Tacos" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden mt-8" style={{ height: "260px", boxShadow: "0 8px 32px rgba(44,24,16,0.18)" }}>
                <img src={NACHOS_IMG} alt="Loaded Nachos" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MENU SECTION ── */}
      <section id="menu-section" style={{ backgroundColor: "#2C1810", paddingBottom: "4rem" }}>
        {/* Section header */}
        <div className="py-16 text-center" style={{ borderBottom: "1px solid rgba(232,168,56,0.2)" }}>
          <p style={{ fontFamily: "'Oswald', sans-serif", color: "#E8A838", fontSize: "0.85rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Explore Our
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 800 }}>
            Full Menu
          </h2>
          <div style={{ width: "60px", height: "3px", backgroundColor: "#C4622D", margin: "1rem auto 0" }} />
        </div>

        {/* Sticky category nav */}
        <div className="sticky top-16 z-40" style={{ backgroundColor: "rgba(44,24,16,0.97)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(232,168,56,0.2)" }}>
          <div
            ref={menuNavRef}
            className="flex gap-1 overflow-x-auto py-3 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {NAV_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                data-id={cat.id}
                onClick={() => scrollToSection(cat.id)}
                className="whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all"
                style={{
                  fontFamily: "'Oswald', sans-serif",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  backgroundColor: activeSection === cat.id ? "#C4622D" : "rgba(255,248,240,0.08)",
                  color: activeSection === cat.id ? "white" : "rgba(255,248,240,0.7)",
                  border: activeSection === cat.id ? "1px solid #C4622D" : "1px solid rgba(255,248,240,0.15)",
                  flexShrink: 0,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu categories */}
        <div className="container pt-8">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {menuCategories.map((category) => (
              <MenuCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOURS & LOCATION ── */}
      <section id="hours" className="py-20" style={{ backgroundColor: "#FFF8F0" }}>
        <div className="container">
          <div className="text-center mb-12">
            <p style={{ fontFamily: "'Oswald', sans-serif", color: "#C4622D", fontSize: "0.85rem", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Visit Us
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700 }}>
              Hours & Location
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Hours card */}
            <div className="rounded-2xl p-8" style={{ backgroundColor: "#2C1810", boxShadow: "0 8px 32px rgba(44,24,16,0.2)" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full" style={{ backgroundColor: "rgba(196,98,45,0.2)" }}>
                  <Clock size={22} style={{ color: "#E8A838" }} />
                </div>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", color: "white", fontSize: "1.3rem", fontWeight: 600, letterSpacing: "0.05em" }}>
                  Opening Hours
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { day: "Monday", hours: "Closed", closed: true },
                  { day: "Tuesday – Thursday", hours: "2:00 PM – 9:00 PM" },
                  { day: "Sunday", hours: "2:00 PM – 9:00 PM" },
                  { day: "Friday – Saturday", hours: "2:00 PM – 10:00 PM" },
                ].map((row) => (
                  <div key={row.day} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(255,248,240,0.1)" }}>
                    <span style={{ fontFamily: "'Lato', sans-serif", color: "rgba(255,248,240,0.8)", fontSize: "0.95rem" }}>{row.day}</span>
                    <span style={{ fontFamily: "'Oswald', sans-serif", color: row.closed ? "#ef4444" : "#E8A838", fontWeight: 600, fontSize: "0.95rem" }}>
                      {row.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location card */}
            <div className="rounded-2xl p-8" style={{ backgroundColor: "#2C1810", boxShadow: "0 8px 32px rgba(44,24,16,0.2)" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full" style={{ backgroundColor: "rgba(196,98,45,0.2)" }}>
                  <MapPin size={22} style={{ color: "#E8A838" }} />
                </div>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", color: "white", fontSize: "1.3rem", fontWeight: 600, letterSpacing: "0.05em" }}>
                  Find Us
                </h3>
              </div>
              <div className="mb-6">
                <p style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                  4549 Austin Blvd
                </p>
                <p style={{ fontFamily: "'Lato', sans-serif", color: "rgba(255,248,240,0.7)", fontSize: "1rem" }}>
                  Island Park, NY
                </p>
              </div>
              <div className="mb-6">
                <a href="tel:5164322119" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Phone size={18} style={{ color: "#C4622D" }} />
                  <span style={{ fontFamily: "'Oswald', sans-serif", color: "#E8A838", fontSize: "1.3rem", fontWeight: 600 }}>
                    (516) 432-2119
                  </span>
                </a>
              </div>
              <a
                href="https://maps.google.com/?q=4549+Austin+Blvd+Island+Park+NY"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 text-center rounded-xl font-bold transition-all hover:scale-105"
                style={{ backgroundColor: "#C4622D", color: "white", fontFamily: "'Oswald', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                Get Directions
              </a>

              {/* Delivery platforms */}
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,248,240,0.1)" }}>
                <p style={{ fontFamily: "'Lato', sans-serif", color: "rgba(255,248,240,0.5)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                  Also available on
                </p>
                <div className="flex gap-3">
                  {["DoorDash", "Uber Eats", "Grubhub"].map((platform) => (
                    <span key={platform} className="px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: "rgba(232,168,56,0.15)", color: "#E8A838", border: "1px solid rgba(232,168,56,0.3)", fontFamily: "'Lato', sans-serif" }}>
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: "#1a0e08", borderTop: "1px solid rgba(232,168,56,0.15)" }}>
        <div className="container py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div style={{ fontFamily: "'Playfair Display', serif", color: "#E8A838", fontSize: "1.6rem", fontWeight: 800 }}>Margaritas Tacos</div>
              <div style={{ fontFamily: "'Oswald', sans-serif", color: "rgba(255,248,240,0.5)", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>Authentic Mexican Street Food</div>
            </div>
            <div className="text-center" style={{ color: "rgba(255,248,240,0.4)", fontFamily: "'Lato', sans-serif", fontSize: "0.85rem" }}>
              <p>4549 Austin Blvd, Island Park, NY</p>
              <p className="mt-1">(516) 432-2119</p>
            </div>
            <div className="text-center md:text-right" style={{ color: "rgba(255,248,240,0.3)", fontFamily: "'Lato', sans-serif", fontSize: "0.8rem" }}>
              <p>© {new Date().getFullYear()} Margaritas Tacos.</p>
              <p className="mt-1">All rights reserved.</p>
              <Link href="/admin" className="block mt-2 text-[#E8A838] hover:underline font-semibold">Order management</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── MENU CARD COMPONENT ──
function MenuCard({ category }: { category: (typeof menuCategories)[0] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      id={category.id}
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "rgba(255,248,240,0.05)",
        border: "1px solid rgba(255,248,240,0.1)",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Card header */}
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setExpanded(!expanded)}
        style={{ borderBottom: expanded ? "1px solid rgba(255,248,240,0.1)" : "none" }}
      >
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${category.badgeColor}`}
            style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {category.name}
          </span>
          <p style={{ color: "rgba(255,248,240,0.55)", fontSize: "0.8rem", fontFamily: "'Lato', sans-serif", lineHeight: 1.4 }}>
            {category.description}
          </p>
          {category.specialNote && (
            <p className="mt-1 font-bold text-sm" style={{ color: "#E8A838", fontFamily: "'Oswald', sans-serif" }}>
              ★ {category.specialNote}
            </p>
          )}
        </div>
        <ChevronDown
          size={18}
          style={{ color: "rgba(255,248,240,0.4)", flexShrink: 0, marginLeft: "1rem", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>

      {/* Items list */}
      {expanded && (
        <div className="p-5 pt-3">
          <div className="space-y-2">
            {category.items.map((item) => (
              <div key={item.name} className="flex items-baseline gap-1">
                <span style={{ color: "rgba(255,248,240,0.85)", fontFamily: "'Lato', sans-serif", fontSize: "0.9rem", fontWeight: item.isVegan ? 700 : 400, flexShrink: 0 }}>
                  {item.isVegan && <Leaf size={12} className="inline mr-1" style={{ color: "#4ade80" }} />}
                  {item.name}
                </span>
                <span className="price-dots" style={{ borderBottom: "1.5px dotted rgba(255,248,240,0.2)", flex: 1, marginBottom: "3px" }} />
                <span style={{ color: "#E8A838", fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "0.95rem", flexShrink: 0 }}>
                  ${item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          {/* Vegan notes */}
          {category.items.filter((i) => i.note).map((item) => (
            <p key={item.name + "-note"} className="mt-3 text-xs italic" style={{ color: "rgba(255,248,240,0.35)", fontFamily: "'Lato', sans-serif", borderTop: "1px solid rgba(255,248,240,0.08)", paddingTop: "0.5rem" }}>
              <Leaf size={10} className="inline mr-1" style={{ color: "#4ade80" }} />
              {item.name}: {item.note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
