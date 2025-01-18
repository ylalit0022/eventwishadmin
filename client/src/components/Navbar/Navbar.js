import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import { useResponsive } from '../../hooks/useResponsive';
import './Navbar.styles.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useResponsive();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          EventWishes Admin
        </Link>

        {isMobile ? (
          <button className="menu-icon" onClick={toggleMenu}>
            {isOpen ? <CloseOutlined /> : <MenuOutlined />}
          </button>
        ) : (
          <div className="nav-menu">
            <NavLinks onClick={closeMenu} />
          </div>
        )}

        {isMobile && (
          <div className={`nav-menu-mobile ${isOpen ? 'active' : ''}`}>
            <NavLinks onClick={closeMenu} />
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLinks = ({ onClick }) => (
  <>
    <Link to="/dashboard" className="nav-link" onClick={onClick}>
      Dashboard
    </Link>
    <Link to="/shared-wishes" className="nav-link" onClick={onClick}>
      Shared Wishes
    </Link>
    <Link to="/shared-files" className="nav-link" onClick={onClick}>
      Shared Files
    </Link>
    <Link to="/templates" className="nav-link" onClick={onClick}>
      Templates
    </Link>
    <Link to="/admob" className="nav-link" onClick={onClick}>
      AdMob
    </Link>
  </>
);

export default Navbar;
