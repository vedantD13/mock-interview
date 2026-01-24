import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, FileText, TrendingUp, Compass, Target, ArrowRight, 
  Sparkles, Zap, ChevronDown, Check, Code, Globe, Cpu,
  BookOpen, Users, HelpCircle, Star, ShieldCheck, Award
} from 'lucide-react';

/* --- SUB-COMPONENTS --- */

// 1. Typewriter Effect
const TypewriterEffect = ({ words }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timeout2 = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(timeout2);
  }, [blink]);

  useEffect(() => {
    if (index === words.length) { setIndex(0); return; }

    if (subIndex === words[index].length + 1 && !reverse) {
      setReverse(true);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 75 : subIndex === words[index].length ? 1000 : 150, parseInt(Math.random() * 350)));

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return (
    <span className="text-blue-500">
      {words[index].substring(0, subIndex)}
      <span className={`${blink ? 'opacity-100' : 'opacity-0'} ml-1`}>|</span>
    </span>
  );
};

// 2. Animated Background Particles
const BackgroundParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-blue-500/10 rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%", 
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0.3 
          }}
          animate={{ 
            y: [null, Math.random() * 100 + "%"],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: Math.random() * 20 + 10, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          style={{
            width: Math.random() * 100 + 50 + "px",
            height: Math.random() * 100 + 50 + "px",
            filter: "blur(20px)"
          }}
        />
      ))}
    </div>
  );
};

// 3. Mock Interview Demo
const MockInterviewDemo = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="max-w-2xl mx-auto mt-20 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10 relative z-10"
    >
      <div className="bg-slate-800 p-3 flex gap-2 items-center border-b border-slate-700">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-slate-400 font-mono">Live Session: React System Design</span>
      </div>
      <div className="p-6 space-y-4 font-mono text-sm">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0"><Bot size={16} /></div>
          <div className="bg-slate-800 p-3 rounded-lg rounded-tl-none text-slate-300">
            <p>Welcome! Let's design a rate limiter. How would you handle distributed requests?</p>
          </div>
        </div>
        <div className="flex gap-4 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0"><span className="font-bold">U</span></div>
          <div className="bg-blue-900/30 border border-blue-800 p-3 rounded-lg rounded-tr-none text-blue-200">
            <p>I would use Redis to store timestamps and a sliding window algorithm.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0"><Bot size={16} /></div>
          <div className="bg-slate-800 p-3 rounded-lg rounded-tl-none text-slate-300">
            <p className="flex items-center gap-2">
              <span className="text-green-400 font-bold">Excellent.</span> 
              That scales well. What about race conditions in Redis?
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// 4. Feature Card
const FeatureCard = ({ icon: Icon, title, desc, delay, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5 }}
    className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl hover:bg-slate-800/80 hover:border-slate-700 transition-all duration-300 group cursor-default"
  >
    <div className={`mb-6 p-4 bg-slate-950 rounded-2xl inline-block border border-slate-800 group-hover:scale-110 transition-transform duration-300 ${color}`}>
      <Icon size={32} />
    </div>
    <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{desc}</p>
  </motion.div>
);

// 5. Testimonial Card
const TestimonialCard = ({ name, role, quote, stars }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className="min-w-[300px] md:min-w-[400px] p-6 bg-slate-900 border border-slate-800 rounded-2xl mx-4"
  >
    <div className="flex gap-1 mb-4 text-yellow-500">
      {[...Array(stars)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
    </div>
    <p className="text-slate-300 mb-6 italic">"{quote}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
        {name[0]}
      </div>
      <div>
        <div className="text-white font-bold text-sm">{name}</div>
        <div className="text-slate-500 text-xs">{role}</div>
      </div>
    </div>
  </motion.div>
);

// 6. Manual Step (The Enhanced Version)
const ManualStep = ({ number, title, desc, icon: Icon, align }) => (
  <motion.div 
    initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, ease: "easeOut" }}
    className={`flex flex-col ${align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}
  >
    <div className="flex-1 space-y-8 text-center md:text-left z-10">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 shadow-lg shadow-blue-900/20">
        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-purple-400">
          0{number}
        </span>
      </div>
      <div>
        <h3 className="text-4xl font-bold text-white leading-tight mb-4">{title}</h3>
        <p className="text-lg text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
    <div className="flex-1 w-full flex justify-center">
      <motion.div 
        whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
        className="relative w-full max-w-md aspect-square rounded-3xl bg-slate-900/50 border border-slate-800 p-8 flex items-center justify-center overflow-hidden group shadow-2xl hover:shadow-blue-500/20 transition-shadow duration-500"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-40 h-40 rounded-2xl bg-gradient-to-b from-slate-700/50 to-slate-800/50 backdrop-blur-xl border border-slate-600/50 flex items-center justify-center shadow-2xl"
        >
          <div className="absolute inset-0 rounded-2xl bg-blue-400/5" />
          <Icon size={80} className="text-blue-200 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" strokeWidth={1.5} />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      </motion.div>
    </div>
  </motion.div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-800">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full py-6 text-left flex justify-between items-center focus:outline-none group">
        <span className="text-lg font-medium text-slate-200 group-hover:text-blue-400 transition-colors">{question}</span>
        <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-500'}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-6 text-slate-400 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* --- MAIN PAGE --- */

const LandingPage = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  if (isSignedIn) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Dynamic Background */}
      <BackgroundParticles />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-purple-900/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-cyan-900/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 p-4 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 cursor-pointer flex items-center gap-2" onClick={() => window.scrollTo(0,0)}>
            <Bot className="text-blue-500" /> CareerAI
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-slate-400 hover:text-white transition flex items-center gap-1"><Sparkles size={16} /> Features</button>
            <button onClick={() => scrollToSection('manual')} className="text-slate-400 hover:text-white transition flex items-center gap-1"><BookOpen size={16} /> Manual</button>
            <button onClick={() => scrollToSection('about')} className="text-slate-400 hover:text-white transition flex items-center gap-1"><Users size={16} /> About</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-white transition hidden sm:block font-medium">Guest Mode</button>
            <SignInButton mode="modal">
              <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-500/20">Sign In</button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-20">
        <div className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-blue-400 mb-8 text-xs font-medium uppercase tracking-wider shadow-inner"
          >
            <Sparkles size={12} /> v2.0 Now Live
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight"
          >
            Master your <br />
            <TypewriterEffect words={["React Interview", "Java Interview", "System Design", "Soft Skills"]} />
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            AI-powered mock interviews, intelligent resume analysis, and real-time market data. Your complete toolkit for career acceleration.
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2">
              Start Practice Now <ArrowRight size={20} />
            </button>
          </div>
          <MockInterviewDemo />
        </div>
      </div>

      {/* 2. MARQUEE */}
      <div className="relative border-y border-slate-800 bg-slate-900/50 backdrop-blur-sm py-6 overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="relative flex overflow-x-hidden group">
          <div className="animate-marquee whitespace-nowrap flex gap-16 items-center text-slate-500 font-bold text-lg tracking-widest uppercase">
            <span>Google</span><span>Amazon</span><span>Microsoft</span><span>Netflix</span><span>Meta</span><span>Tesla</span><span>Uber</span><span>Airbnb</span><span>Stripe</span><span>Spotify</span>
            <span>Google</span><span>Amazon</span><span>Microsoft</span><span>Netflix</span><span>Meta</span><span>Tesla</span><span>Uber</span><span>Airbnb</span><span>Stripe</span><span>Spotify</span>
          </div>
        </div>
      </div>

      {/* 3. FEATURES GRID (New) */}
      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-bold mb-4">Complete Career Toolkit</motion.h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to go from job seeker to job landed.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard icon={Bot} title="AI Mock Interviews" desc="Practice with realistic AI personas that adapt to your responses and role." color="text-blue-400" delay={0.1} />
          <FeatureCard icon={FileText} title="Resume Builder" desc="Create ATS-optimized resumes with AI suggestions to beat the bots." color="text-purple-400" delay={0.2} />
          <FeatureCard icon={Globe} title="Market Insights" desc="Real-time data on salaries, demand, and hiring trends in your region." color="text-green-400" delay={0.3} />
          <FeatureCard icon={Target} title="Skill Tracking" desc="Monitor your technical and soft skill growth over time with charts." color="text-red-400" delay={0.4} />
          <FeatureCard icon={Compass} title="Career Pathing" desc="Get a personalized roadmap to bridge the gap to your dream role." color="text-yellow-400" delay={0.5} />
          <FeatureCard icon={Zap} title="Instant Feedback" desc="Detailed analysis of your answers, tone, and body language instantly." color="text-orange-400" delay={0.6} />
        </div>
      </div>

      {/* 4. USER MANUAL SECTION */}
      <div id="manual" className="relative z-10 max-w-7xl mx-auto px-6 py-32 border-t border-slate-800/50">
        <div className="text-center mb-24">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-5xl font-bold mb-6">How It Works</motion.h2>
          <p className="text-slate-400 text-lg">Your path to interview mastery in three steps.</p>
        </div>
        <div className="space-y-32">
          <ManualStep number="1" title="Setup Your Profile" desc="Log in to the Dashboard. Enter your role, tech stack, and experience. This data customizes your AI interviewer's persona." icon={Cpu} align="left" />
          <ManualStep number="2" title="Choose Your Challenge" desc="Select 'Start Interview'. Choose between Behavioral (HR) or Technical (Coding) rounds. The AI initializes a unique context." icon={Bot} align="right" />
          <ManualStep number="3" title="Receive Feedback" desc="After the session, get a comprehensive report card highlighting your grammatical accuracy, technical correctness, and confidence." icon={FileText} align="left" />
        </div>
      </div>

      {/* 5. TESTIMONIALS (New) */}
      <div className="relative z-10 bg-slate-900/30 py-24 border-y border-slate-800">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Loved by Developers</h2>
          <p className="text-slate-400">Join 10,000+ engineers practicing daily.</p>
        </div>
        <div className="flex overflow-x-auto pb-8 hide-scrollbar px-6 snap-x">
          <TestimonialCard name="Alex R." role="Senior Frontend Dev" quote="The system design feedback was scarily accurate. It helped me land my L5 role at Google." stars={5} />
          <TestimonialCard name="Sarah M." role="Junior Developer" quote="I was terrified of behavioral questions. This tool helped me frame my stories perfectly." stars={5} />
          <TestimonialCard name="James K." role="Full Stack Engineer" quote="The Resume Builder found 3 critical errors in my CV that I had missed for years." stars={4} />
          <TestimonialCard name="Priya P." role="DevOps Engineer" quote="Practicing negotiation scenarios with the AI helped me get a 20% higher offer." stars={5} />
        </div>
      </div>

      {/* 6. ABOUT & STATS */}
      <div id="about" className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">About CareerAI</h2>
        <p className="text-lg text-slate-300 leading-relaxed mb-12">
          CareerAI was born from a simple observation: technical skills alone don't get you hired. 
          Confidence and communication do. We built this platform to give developers a safe, realistic 
          environment to fail, learn, and improve before they step into the actual interview room.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-blue-500/30 transition group">
            <div className="text-3xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform">24/7</div>
            <div className="text-sm text-slate-500 uppercase flex items-center justify-center gap-1"><Award size={14}/> Availability</div>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-purple-500/30 transition group">
            <div className="text-3xl font-bold text-purple-400 mb-2 group-hover:scale-110 transition-transform">Zero</div>
            <div className="text-sm text-slate-500 uppercase flex items-center justify-center gap-1"><ShieldCheck size={14}/> Judgment</div>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-green-500/30 transition group">
            <div className="text-3xl font-bold text-green-400 mb-2 group-hover:scale-110 transition-transform">100%</div>
            <div className="text-sm text-slate-500 uppercase flex items-center justify-center gap-1"><Target size={14}/> Personalized</div>
          </div>
        </div>
      </div>

      {/* 7. FAQ */}
      <div id="faq" className="relative z-10 max-w-3xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
        <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
          <FAQItem question="Is it free to use?" answer="Yes! You can use the Guest Mode to try out the mock interviews and view market insights without creating an account." />
          <FAQItem question="Can I customize the interview?" answer="Absolutely. You input your job role, tech stack, and experience level, and our AI tailors the questions specifically to you." />
          <FAQItem question="How accurate is the feedback?" answer="We use advanced LLMs trained on thousands of successful interviews to analyze your technical accuracy and communication style." />
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="relative z-10 px-6 pb-20">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-900 to-purple-900 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to land your dream job?</h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">Stop guessing and start preparing with data-backed insights and realistic practice.</p>
            <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-white text-blue-900 rounded-full font-bold hover:bg-blue-50 transition shadow-xl">Get Started for Free</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950 pt-16 pb-8 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-8 flex justify-center items-center gap-2 text-2xl font-bold text-white">
            <Bot className="text-blue-500" /> CareerAI
          </div>
          <div className="flex justify-center gap-8 mb-8">
            <a href="#" className="hover:text-white transition">Twitter</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a href="#" className="hover:text-white transition">LinkedIn</a>
          </div>
          <p>© 2024 CareerAI. Built for developers, by developers.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;