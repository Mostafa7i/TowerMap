"use client";
import { motion } from "framer-motion";
import { Radio } from "lucide-react"; 

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-gray-900 text-white">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: 1,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative mb-10"
        >
          {/* دائرة خلفية بتعمل تأثير الموجة (Wave Effect) */}
          <motion.div
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-indigo-500 rounded-full"
          />

          <div className="relative z-10 w-20 h-20 bg-linear-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-2xl">
            <Radio size={48} className="text-white" />
          </div>
        </motion.div>

        {/* اسم الموقع */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-extrabold mb-4 bg-linear-to-r from-indigo-300 via-purple-400 to-indigo-300 bg-clip-text text-transparent"
        >
          Tower Monitor
        </motion.h1>

        {/* الـ 3 نقط (أنيميشن الموجة) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex space-x-2 rtl:space-x-reverse"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatType: "reverse",
                delay: index * 0.2,
              }}
              className="h-4 w-4 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
