import React from 'react';
import { Card } from 'antd';
import { useResponsive } from '../hooks/useResponsive';

const ResponsiveCard = ({
  children,
  title,
  extra,
  bodyStyle = {},
  className = '',
  ...props
}) => {
  const { isMobile, isTablet } = useResponsive();

  // Adjust padding based on screen size
  const getResponsiveBodyStyle = () => ({
    padding: isMobile ? 12 : (isTablet ? 16 : 24),
    ...bodyStyle
  });

  // Handle responsive title display
  const getResponsiveTitle = () => {
    if (typeof title === 'string') {
      return (
        <div style={{ 
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 500,
          lineHeight: 1.4
        }}>
          {title}
        </div>
      );
    }
    return title;
  };

  return (
    <Card
      title={getResponsiveTitle()}
      extra={extra}
      bodyStyle={getResponsiveBodyStyle()}
      className={`responsive-card ${className}`}
      size={isMobile ? 'small' : 'default'}
      {...props}
    >
      {children}
    </Card>
  );
};

export default ResponsiveCard;
