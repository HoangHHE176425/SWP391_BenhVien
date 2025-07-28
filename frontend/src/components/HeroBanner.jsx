import React from "react";
import "../assets/css/HeroBanner.css";

const HeroBanner = ({ image, title, subtitle }) => (
  <div className="hero-banner" style={{ backgroundImage: `url('${image}')` }}>
    <div className="hero-banner-overlay" />
    <div className="hero-banner-content">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  </div>
);

export default HeroBanner;