// components/TeamCard.jsx

import { motion } from "framer-motion";
import React from "react";


export default function TeamCard({ member }) {
      const teamMembers = [
    {
      name: "أحمد",
      role: "Front-End & Leader",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces",
    },
    {
      name: "يمني",
      role: "مصممة UI/UX",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces",
    },
    {
      name: "محمد",
      role: "Backend & DevOps",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces",
    },
    {
      name: "ايمان",
      role: "Data Scientist & AI",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces",
    },
    {
      name: "مايسه",
      role: "Data Scientist & AI",
      image:
        "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "زينب",
      role: "Data Scientist & AI",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "نجوي",
      role: "Data Scientist & AI",
      image:
        "https://plus.unsplash.com/premium_photo-1690407617686-d449aa2aad3c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      name: "ريم علي",
      role: "Data Scientist & AI",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces",
    },
  ];
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
