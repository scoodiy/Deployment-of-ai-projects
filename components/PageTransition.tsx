"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: "easeOut", duration: 0.28 }}
    >
      {children}
    </motion.div>
  );
}
