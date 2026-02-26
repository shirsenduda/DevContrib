'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValue, useSpring, animate } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Search, Zap, CheckCircle, ArrowRight, Github, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { Footer } from '@/components/layout/footer';

/* ─── Animated counter hook ─── */
function useAnimatedCounter(target: number, duration = 2) {
  const [value, setValue] = useState(0);
  const motionVal = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return controls.stop;
  }, [motionVal, target, duration]);

  return value;
}

/* ─── Stats counter component ─── */
function StatCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const count = useAnimatedCounter(inView ? value : 0, 1.5);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Hook to fetch real platform stats ─── */
function usePlatformStats() {
  const [stats, setStats] = useState({ repos: 0, issues: 0, mergeRate: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setStats(json.data);
      })
      .catch(() => {});
  }, []);

  return stats;
}

/* ─── Steps data ─── */
const steps = [
  {
    icon: Search,
    title: 'We Find',
    description: 'Our engine scrapes GitHub daily to surface high-quality issues from active, welcoming repositories.',
  },
  {
    icon: Zap,
    title: 'You Pick',
    description: 'Get personalized recommendations matched to your skills, experience, and preferred languages.',
  },
  {
    icon: CheckCircle,
    title: 'You Ship',
    description: 'Start contributing with confidence. We track your PR from open to merged.',
  },
];

export default function LandingPage() {
  const platformStats = usePlatformStats();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 1.4]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  // Mouse spotlight for hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const spotY = useSpring(mouseY, { stiffness: 100, damping: 30 });
  const heroSpotlight = useTransform(
    [spotX, spotY],
    ([x, y]) => `radial-gradient(800px circle at ${x}px ${y}px, rgba(0, 112, 243, 0.04), transparent 60%)`,
  );

  const handleHeroMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.04] bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo href="/" />
          <div className="hidden items-center gap-8 sm:flex">
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">How it works</a>
            <a href="#stats" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Stats</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Log In
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-all hover:opacity-90"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
      >
        {/* Mouse-tracking spotlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: heroSpotlight }}
        />

        {/* Grid overlay */}
        <div className="hero-grid pointer-events-none absolute inset-0" />

        {/* Content */}
        <motion.div
          style={{ y: textY }}
          className="relative z-10 px-6 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-border bg-card/80 px-4 py-2 text-xs backdrop-blur-sm sm:text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-muted-foreground">Now matching developers with issues</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-tight"
          >
            Find and ship your next{' '}
            <br className="hidden sm:block" />
            open source contribution.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base"
          >
            DevContrib matches you with high-quality GitHub issues
            <br className="hidden sm:block" />
            you can actually complete and get merged.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-all hover:opacity-90"
            >
              <Github className="h-4 w-4" />
              Start Contributing
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-foreground/20 hover:text-foreground"
            >
              See how it works
            </Link>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 text-xs text-muted-foreground/60"
          >
            Free forever. No credit card required.
          </motion.p>
        </motion.div>

        {/* ─── Dramatic gradient glow at bottom ─── */}
        <motion.div
          style={{ scale: glowScale, opacity: glowOpacity }}
          className="pointer-events-none absolute bottom-0 left-0 right-0"
        >
          <div className="hero-gradient" />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="h-7 w-4 rounded-full border border-muted-foreground/30 p-0.5"
          >
            <div className="mx-auto h-1.5 w-0.5 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="relative border-t border-border py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl">
              Three steps. That&apos;s it.
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              No more digging through thousands of issues.
            </p>
          </motion.div>

          <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group relative bg-card p-10 transition-colors hover:bg-secondary/30"
                >
                  <span className="mb-8 block text-sm font-medium text-muted-foreground">
                    0{index + 1}
                  </span>
                  <div className="mb-5 inline-flex rounded-xl border border-border bg-secondary p-3 transition-colors group-hover:border-foreground/10 group-hover:bg-secondary/80">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section id="stats" className="border-t border-border py-28">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              Built for real impact
            </h2>
            <p className="mt-3 text-muted-foreground">
              Numbers that speak for themselves.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: platformStats.repos, suffix: '+', label: 'Curated Repos' },
              { value: platformStats.issues, suffix: '+', label: 'Active Issues' },
              { value: platformStats.mergeRate, suffix: '%', label: 'Merge Rate' },
              { value: 5, suffix: ' min', label: 'To First Match', prefix: '< ' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="text-center"
              >
                <p className="text-4xl font-bold tracking-tighter sm:text-5xl">
                  {stat.prefix || ''}<StatCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-border">
        <div className="relative overflow-hidden py-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute bottom-0 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 translate-y-1/3 rounded-full bg-blue/[0.07] blur-[100px]" />
          </div>

          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold tracking-tighter sm:text-5xl lg:text-6xl"
            >
              Ready to start shipping?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 text-base text-muted-foreground sm:text-lg"
            >
              Sign in with GitHub and get your first match in under a minute.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link
                href="/login"
                className="group mt-10 inline-flex items-center gap-2.5 rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-all hover:opacity-90"
              >
                <Github className="h-4 w-4" />
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <Footer href="/" />
    </div>
  );
}
