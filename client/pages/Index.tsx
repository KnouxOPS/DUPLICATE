import { useApp } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import Splash from "./Splash";
import Onboarding from "./Onboarding";
import Dashboard from "./Dashboard";
import ScanPage from "./Scan";
import SettingsPage from "./Settings";
import RulesPage from "./Rules";
import HelpPage from "./Help";
import ContactPage from "./Contact";

const pageVariants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const splashVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, scale: 1.05, transition: { duration: 0.4 } },
};

export default function Index() {
  const { currentPage } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case "splash":
        return (
          <motion.div
            key="splash"
            variants={splashVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Splash />
          </motion.div>
        );
      case "onboarding":
        return (
          <motion.div
            key="onboarding"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Onboarding />
          </motion.div>
        );
      case "dashboard":
        return (
          <motion.div
            key="dashboard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Dashboard />
          </motion.div>
        );
      case "scan":
        return (
          <motion.div
            key="scan"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ScanPage />
          </motion.div>
        );
      case "settings":
        return (
          <motion.div
            key="settings"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <SettingsPage />
          </motion.div>
        );
      case "rules":
        return (
          <motion.div
            key="rules"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <RulesPage />
          </motion.div>
        );
      case "help":
        return (
          <motion.div
            key="help"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <HelpPage />
          </motion.div>
        );
      case "contact":
        return (
          <motion.div
            key="contact"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <ContactPage />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {renderPage()}
    </AnimatePresence>
  );
}
