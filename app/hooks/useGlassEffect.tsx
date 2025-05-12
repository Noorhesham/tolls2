import { useState } from "react";
import { useEffect } from "react";

export const useGlossEffect = (cardRef, cardContentRef, glossRef) => {
  const mapNumberRange = (n, a, b, c, d) => {
    return ((n - a) * (d - c)) / (b - a) + c;
  };

  const addShineClass = () => {
    requestAnimationFrame(() => {
      glossRef.current.classList.add("gloss--shine");
    });
  };

  const calculateTransformValues = (pointerX, pointerY, cardRect) => {
    const halfWidth = cardRect.width / 2;
    const halfHeight = cardRect.height / 2;
    const cardCenterX = cardRect.left + halfWidth;
    const cardCenterY = cardRect.top + halfHeight;
    const deltaX = pointerX - cardCenterX;
    const deltaY = pointerY - cardCenterY;
    const distanceToCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = Math.max(halfWidth, halfHeight);
    const degree = mapNumberRange(distanceToCenter, 0, maxDistance, 0, 10);
    const rx = mapNumberRange(deltaY, 0, halfWidth, 0, 1);
    const ry = mapNumberRange(deltaX, 0, halfHeight, 0, 1);
    return { rx, ry, degree, distanceToCenter, maxDistance };
  };

  const applyTransform = (rx, ry, degree, distanceToCenter, maxDistance) => {
    const cardTransform = `perspective(400px) rotate3d(${-rx}, ${ry}, 0, ${degree}deg)`;
    const glossTransform = `translate(${-ry * 100}%, ${-rx * 100}%) scale(2.4)`;
    const glossOpacity = mapNumberRange(distanceToCenter, 0, maxDistance, 0, 0.6);

    cardContentRef.current.style.transform = cardTransform;
    glossRef.current.style.transform = glossTransform;
    glossRef.current.style.opacity = glossOpacity.toString();
  };

  const handleMouseMove = ({ clientX, clientY }) => {
    const card = cardRef.current;
    const cardRect = card.getBoundingClientRect();

    const { rx, ry, degree, distanceToCenter, maxDistance } = calculateTransformValues(clientX, clientY, cardRect);

    applyTransform(rx, ry, degree, distanceToCenter, maxDistance);
  };

  const handleMouseLeave = () => {
    cardContentRef.current.style.transform = null;
    glossRef.current.style.opacity = 0;
  };

  useEffect(() => {
    const card = cardRef.current;

    addShineClass();

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cardRef, cardContentRef, glossRef]);
};
