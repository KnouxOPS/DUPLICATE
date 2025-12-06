import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 2,
}));

export default function Splash() {
  const { setCurrentPage, hasCompletedOnboarding, t } = useApp();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 25;
      });
    }, 180);

    const timer = setTimeout(() => {
      if (hasCompletedOnboarding) {
        setCurrentPage("dashboard");
      } else {
        setCurrentPage("onboarding");
      }
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [setCurrentPage, hasCompletedOnboarding]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const logoVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.5,
      rotate: -180,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        duration: 1.2,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 20,
      },
    },
  };

  const floatAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const glowPulse = {
    scale: [1, 1.1, 1],
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <motion.div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#0f0f1a]"></div>

      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-purple-500/40"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [-20, -100, -20],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"
        animate={glowPulse}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"
        animate={{
          ...glowPulse,
          transition: { ...glowPulse.transition, delay: 1.5 },
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-600/15 rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />

      <motion.div
        className="relative z-10 text-center"
        variants={containerVariants}
      >
        <motion.div className="mb-8" animate={floatAnimation}>
          <motion.div
            className="inline-flex items-center justify-center w-40 h-40 mb-8 relative"
            variants={logoVariants}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              className="absolute inset-2 rounded-full border-2 border-purple-500/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-4 rounded-full border border-blue-500/20"
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />

            <motion.div
              className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/40"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring" as const, stiffness: 300 }}
            >
              <motion.span
                className="text-white font-bold text-4xl tracking-tight"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(168, 85, 247, 0.5)",
                    "0 0 20px rgba(168, 85, 247, 0.8)",
                    "0 0 10px rgba(168, 85, 247, 0.5)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                K
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.h1
          className="text-5xl font-bold mb-3 gradient-text"
          variants={textVariants}
        >
          Knoux
        </motion.h1>

        <motion.p
          className="text-lg text-white/60 mb-4"
          variants={textVariants}
        >
          AI Duplicate Cleaner
        </motion.p>

        <motion.p
          className="text-xl text-white/80 mb-12 font-medium max-w-md mx-auto"
          variants={textVariants}
        >
          {t.app.tagline}
        </motion.p>

        <motion.div
          className="w-72 mx-auto"
          variants={textVariants}
        >
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          <motion.div
            className="flex items-center justify-center gap-2 mt-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-purple-500"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <p className="text-sm text-white/50">{t.app.loading}</p>
          </motion.div>
        </motion.div>

        <motion.p
          className="text-xs text-white/30 mt-12"
          variants={textVariants}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Powered by AI • SHA-256 Hashing • Smart Detection
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
