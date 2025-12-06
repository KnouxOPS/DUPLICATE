import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  ArrowLeft, 
  User, 
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const { setCurrentPage, isRTL } = useApp();

  const contactInfo = {
    name: "Eng / Sadek elgazar",
    phone: "+971503281920",
    email: "knouxops@gmail.com",
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const cardHover = {
    scale: 1.02,
    y: -5,
    transition: { type: "spring" as const, stiffness: 300 },
  };

  const iconVariants = {
    hover: { 
      scale: 1.2, 
      rotate: 10,
      transition: { type: "spring" as const, stiffness: 400 }
    },
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#0f0f1a]"></div>
      
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[150px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-[120px]"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 min-h-screen p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            onClick={() => setCurrentPage("dashboard")}
            className="mb-8 text-white/70 hover:text-white hover:bg-white/10 transition-all group"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'} group-hover:${isRTL ? 'translate-x-1' : '-translate-x-1'} transition-transform`} />
            {isRTL ? 'العودة' : 'Back'}
          </Button>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-6 shadow-2xl shadow-purple-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring" as const, stiffness: 300 }}
            >
              <User className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              {isRTL ? 'تواصل معنا' : 'Contact Us'}
            </h1>
            
            <p className="text-white/60 text-lg max-w-md mx-auto">
              {isRTL 
                ? 'نحن هنا لمساعدتك. تواصل معنا بأي وقت'
                : 'We are here to help. Reach out to us anytime'
              }
            </p>
          </motion.div>

          <motion.div 
            className="glass-card p-8 rounded-3xl mb-8 border border-white/10"
            variants={itemVariants}
          >
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                animate={{ 
                  boxShadow: [
                    "0 10px 25px rgba(168, 85, 247, 0.3)",
                    "0 10px 35px rgba(168, 85, 247, 0.5)",
                    "0 10px 25px rgba(168, 85, 247, 0.3)",
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-white">{contactInfo.name}</h2>
                <p className="text-white/50">{isRTL ? 'المؤسس والمطور' : 'Founder & Developer'}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4">
            <motion.a
              href={`tel:${contactInfo.phone}`}
              className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4 group cursor-pointer"
              variants={itemVariants}
              whileHover={cardHover}
            >
              <motion.div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
                variants={iconVariants}
                whileHover="hover"
              >
                <Phone className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">{isRTL ? 'الهاتف' : 'Phone'}</p>
                <p className="text-white text-lg font-medium" dir="ltr">{contactInfo.phone}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
            </motion.a>

            <motion.a
              href={`https://wa.me/${contactInfo.phone.replace(/\+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4 group cursor-pointer"
              variants={itemVariants}
              whileHover={cardHover}
            >
              <motion.div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-green-500/30"
                variants={iconVariants}
                whileHover="hover"
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">{isRTL ? 'واتساب' : 'WhatsApp'}</p>
                <p className="text-white text-lg font-medium" dir="ltr">{contactInfo.phone}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
            </motion.a>

            <motion.a
              href={`mailto:${contactInfo.email}`}
              className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4 group cursor-pointer"
              variants={itemVariants}
              whileHover={cardHover}
            >
              <motion.div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                variants={iconVariants}
                whileHover="hover"
              >
                <Mail className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <p className="text-white/50 text-sm mb-1">{isRTL ? 'البريد الإلكتروني' : 'Email'}</p>
                <p className="text-white text-lg font-medium">{contactInfo.email}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
            </motion.a>
          </div>

          <motion.div 
            className="text-center mt-12"
            variants={itemVariants}
          >
            <p className="text-white/40 text-sm">
              {isRTL 
                ? '© 2024 Knoux AI. جميع الحقوق محفوظة'
                : '© 2024 Knoux AI. All rights reserved'
              }
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
