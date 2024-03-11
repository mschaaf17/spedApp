import React from 'react';
import './index.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="">
        &copy;{new Date().getFullYear()} by MSchaaf1
      </div>
    </footer>
  );
};

export default Footer;
