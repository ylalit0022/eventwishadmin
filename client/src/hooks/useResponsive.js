import { useState, useEffect } from 'react';

const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024 && width > 768);
      setIsDesktop(width > 1024);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoints: {
      xs: window.innerWidth < breakpoints.sm,
      sm: window.innerWidth >= breakpoints.sm && window.innerWidth < breakpoints.md,
      md: window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg,
      lg: window.innerWidth >= breakpoints.lg && window.innerWidth < breakpoints.xl,
      xl: window.innerWidth >= breakpoints.xl
    }
  };
};

export const mediaQueries = {
  xs: `@media (max-width: ${breakpoints.xs}px)`,
  sm: `@media (max-width: ${breakpoints.sm}px)`,
  md: `@media (max-width: ${breakpoints.md}px)`,
  lg: `@media (max-width: ${breakpoints.lg}px)`,
  xl: `@media (max-width: ${breakpoints.xl}px)`,
  xxl: `@media (max-width: ${breakpoints.xxl}px)`,
};
