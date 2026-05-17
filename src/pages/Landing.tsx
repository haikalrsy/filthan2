import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, Users, ClipboardCheck, GraduationCap } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark overflow-hidden font-sans">
      {/* Hero Section */}
      <div className="relative py-20 px-6 sm:px-12 lg:px-24 flex items-center min-h-[90vh]">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[100%] bg-primary/20 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[80%] bg-primary/10 rounded-full blur-[150px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left lg:w-3/5"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary font-black text-[10px] tracking-[0.3em] uppercase mb-8 neo-glow">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Next-Gen Academic Authority
              </div>
              <h1 className="text-5xl sm:text-8xl font-extrabold mb-8 leading-[0.9] tracking-tighter uppercase font-mono italic">
                NeoVision <br />
                <span className="text-white/20">Protocol</span>
              </h1>
              <p className="text-lg sm:text-xl mb-12 text-gray-500 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed uppercase tracking-tight">
                Consolidating student performance metrics into transparent, 
                secure decision matrices. The future of academic validation.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <button 
                  onClick={() => navigate('/cek-hasil')}
                  className="px-10 py-5 bg-white text-dark font-black rounded-2xl shadow-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-3 uppercase tracking-tighter text-sm group"
                >
                  <GraduationCap size={20} />
                  Access Decision
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-10 py-5 bg-surface-lighter text-white border border-border font-black rounded-2xl hover:bg-primary transition-all flex items-center justify-center gap-3 uppercase tracking-tighter text-sm group"
                >
                  <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                  Authority Login
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hidden lg:block lg:w-2/5"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl group-hover:bg-primary/30 transition-all"></div>
                <div className="relative bg-surface rounded-[40px] border border-border p-8 backdrop-blur-3xl overflow-hidden">
                   <div className="absolute inset-0 bg-primary-gradient opacity-5"></div>
                   <div className="relative space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="w-12 h-2 bg-primary/40 rounded-full"></div>
                        <div className="w-4 h-4 bg-primary/40 rounded-full"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-12 bg-surface-lighter rounded-2xl border border-border"></div>
                        <div className="h-12 bg-surface-lighter rounded-2xl border border-border"></div>
                        <div className="h-12 bg-primary/20 rounded-2xl border border-primary/30 flex items-center px-4">
                           <div className="w-2/3 h-2 bg-primary rounded-full"></div>
                        </div>
                      </div>
                      <div className="pt-4 grid grid-cols-2 gap-4">
                        <div className="h-24 bg-surface-lighter rounded-3xl border border-border"></div>
                        <div className="h-24 bg-surface-lighter rounded-3xl border border-border"></div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-32 px-6 sm:px-12 lg:px-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="md:w-1/2">
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.5em] mb-4">Core Infrastructure</h2>
            <h3 className="text-4xl sm:text-5xl font-black text-white uppercase italic font-mono leading-none tracking-tighter">Engineered for <br/> Absolute Clarity</h3>
          </div>
          <p className="text-gray-500 font-medium md:w-1/3 leading-relaxed">Advanced academic verification through secure decentralized metrics and authority-driven consensus.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <ShieldCheck className="text-primary" size={24} />,
              title: "Encrypted Protocol",
              desc: "Multi-layer security via Supabase RLS and custom decision authority validation."
            },
            {
              icon: <Users className="text-primary" size={24} />,
              title: "Authority Matrix",
              desc: "Hierarchical permissions giving Admins and Gurus specific voting capabilities."
            },
            {
              icon: <ClipboardCheck className="text-primary" size={24} />,
              title: "Real-time Recaps",
              desc: "Instant synchronization of attendance and voting data for final decision generation."
            }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              className="p-10 bg-surface rounded-[32px] border border-border hover:bg-surface-lighter transition-all group"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-primary/20 group-hover:neo-glow transition-all">
                {feature.icon}
              </div>
              <h3 className="text-lg font-black mb-4 uppercase italic font-mono tracking-tight group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-medium uppercase tracking-tighter opacity-80">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-20 px-6 text-center border-t border-border">
        <div className="max-w-xl mx-auto space-y-6">
           <div className="flex justify-center gap-8 opacity-20">
              <span className="font-mono text-xs">SV-PROTOCOL</span>
              <span className="font-mono text-xs">V2.4.9</span>
              <span className="font-mono text-xs">SECURE-LINK</span>
           </div>
           <p className="text-gray-700 font-black text-[10px] tracking-[0.4em] uppercase">
             &copy; 2026 NEOVISION GLOBAL // THE AUTHORITY OF EDUCATION
           </p>
        </div>
      </footer>
    </div>
  );
}
