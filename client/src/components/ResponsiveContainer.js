import React from 'react';
import { useResponsive } from '../hooks/useResponsive';

const ResponsiveContainer = ({ 
  children,
  fluid = false,
  gutter = true,
  className = '',
  style = {}
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  const containerStyle = {
    width: '100%',
    maxWidth: fluid ? '100%' : '1400px',
    margin: '0 auto',
    padding: gutter ? (isMobile ? '0 12px' : isTablet ? '0 16px' : '0 24px') : '0',
    ...style
  };

  return (
    <div className={`responsive-container ${className}`} style={containerStyle}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;
