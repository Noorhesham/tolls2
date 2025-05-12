"use client";
import React, { useEffect, useRef } from "react";

const AnimatedTitle = ({ title, paragraph }: { title: string; paragraph: string }) => {
  const animatedH1 = useRef<HTMLHeadingElement>(null);
  const animatedP = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const h1 = animatedH1.current;
    h1.style.width = "0px";
    const p = animatedP.current;
    p.style.width = "0px";
    setTimeout(() => {
      h1.style.width = `100px`;
      p.style.width = `200px`;
    }, 100);
  }, []);
  return (
    <div>
      <div className="text-2xl overflow-hidden flex items-center gap-4">
        <h1
          ref={animatedH1}
          className="flex duration-200 text-nowrap w-0 overflow-hidden relative font-semibold tracking-tight text-white"
        >
          {title}
        </h1>
        <p ref={animatedP} className="font-semibold w-0 text-nowrap text-gray-400">
          {paragraph}
        </p>
      </div>
    </div>
  );
};

export default AnimatedTitle;
