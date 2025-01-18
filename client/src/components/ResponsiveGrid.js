import React from 'react';
import { Row, Col } from 'antd';
import { useResponsive } from '../hooks/useResponsive';

const ResponsiveGrid = ({
  children,
  gutter = [16, 16],
  columnCount = 4,
  className = '',
  style = {}
}) => {
  const { isMobile, isTablet } = useResponsive();
  
  // Calculate responsive columns
  const getResponsiveSpan = () => {
    if (isMobile) return 24; // Full width on mobile
    if (isTablet) return columnCount <= 2 ? 12 : 24; // Two columns on tablet if originally 2 or less, else full width
    return Math.floor(24 / columnCount); // Desktop follows requested column count
  };

  // Calculate responsive gutter
  const responsiveGutter = isMobile ? [8, 8] : gutter;

  return (
    <Row 
      gutter={responsiveGutter}
      className={`responsive-grid ${className}`}
      style={style}
    >
      {React.Children.map(children, (child, index) => (
        <Col span={getResponsiveSpan()} key={index}>
          {child}
        </Col>
      ))}
    </Row>
  );
};

export default ResponsiveGrid;
