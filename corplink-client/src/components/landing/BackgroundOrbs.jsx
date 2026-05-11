import { motion } from "framer-motion";
import { useMemo } from "react";

export default function BackgroundOrbs() {
  const raindrops = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // random horizontal position (%)
      duration: Math.random() * 10 + 10, // 10 to 20 seconds falling speed
      delay: Math.random() * 10, // random start delay
      size: Math.random() * 3 + 2, // 2px to 5px size
      opacity: Math.random() * 0.3 + 0.1, // 0.1 to 0.4 opacity for subtlety
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-40 overflow-hidden pointer-events-none">
      {/* Existing Background Orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 120, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full"
      />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-orange-600/10 blur-[100px] rounded-full"
      />

      {/* Subtle Orange Rain Effect */}
      {raindrops.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute bg-orange-500 rounded-full"
          style={{
            left: `${drop.x}%`,
            width: `${drop.size}px`,
            height: `${drop.size}px`,
            opacity: drop.opacity,
            top: "-5%", // start slightly above the screen
          }}
          animate={{
            y: ["0vh", "110vh"], // fall down to slightly below the screen
          }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            ease: "linear",
            delay: drop.delay,
          }}
        />
      ))}
    </div>
  );
}
