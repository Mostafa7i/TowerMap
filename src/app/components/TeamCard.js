// components/TeamCard.jsx

import { motion } from "framer-motion";
import React from "react";

export default function TeamCard({ member }) {
  const { name, role, image } = member;

  return (
    <motion.div
      className=" shrink-0 bg-linear-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl group transition-all duration-300 hover:shadow-2xl hover:-translate"
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* الصورة */}
      <div className="relative aspect-auto overflow-hidden">
        <img
          src={image}
          alt={name}
          className=" w-full h-52 object-cover transition-transform duration-700 group-hover:scale"
          loading="lazy"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration" />
      </div>

      {/* النصوص */}
      <div className="p-5 md:p-6 text-center">
        <h3 className=" text-lg sm:text-xl md:text-2xl  font-bold  text-white  mb-2  group-hover:text-violet-300  transition-colors">
          {name}
        </h3>

        <p className=" text-sm sm:text-base md:text-lg  text-violet-400/90 font-me">
          {role}
        </p>
      </div>
    </motion.div>
  );
}
