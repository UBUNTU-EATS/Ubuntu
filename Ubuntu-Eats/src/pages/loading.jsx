import React, { useEffect, useRef } from "react";

const LoadingDots = ({
  numIcons = 7,
  radius = 60,
  speed = 0.5,
  size = 30,
}) => {
  const containerRef = useRef(null);
  const angleRef = useRef(0);

  const foodIcons = ["🍎", "🥖", "🍕", "🥗", "🍔", "🥟", "🍩"];

  useEffect(() => {
    let animationId;

    const animate = () => {
      const container = containerRef.current;
      if (container) {
        const children = Array.from(container.querySelectorAll(".icon"));
        angleRef.current += (speed * Math.PI * 2) / 60;

        children.forEach((icon, index) => {
          const angle = angleRef.current + (index * (Math.PI * 2)) / numIcons;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          const normalizedAngle =
            (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const fadeFactor = (Math.cos(normalizedAngle) + 1) / 2;
          const opacity = 0.4 + fadeFactor * 0.6;

          icon.style.transform = `translate(${x}px, ${y}px)`;
          icon.style.opacity = opacity.toString();
        });
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [numIcons, radius, speed]);

  return (
    <section
      className="loading-container"
      ref={containerRef}
      style={{
        position: "relative",
        width: `${radius * 2 + size}px`,
        height: `${radius * 2 + size}px`,
      }}
    >
      {/* Center Text */}
      <section
        className="loading-text"
        style={{
          position: "absolute",
          top: "55%",
          left: "58%",
          transform: "translate(-50%, -50%)",
          color: "black",
          fontWeight: "bold",
          fontSize: "1rem",
          pointerEvents: "none",
        }}
      >
        Ubuntu-Eats
      </section>

      {/* Circulating Icons */}
      {foodIcons.map((icon, i) => (
        <div
          key={i}
          className="icon"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: `${size}px`,
            height: `${size}px`,
            fontSize: `${size}px`,
            transform: "translate(0, 0)",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        >
          {icon}
        </div>
      ))}
    </section>
  );
};

export default LoadingDots;
