import React from 'react';
import { Table } from 'antd';
import { useResponsive } from '../hooks/useResponsive';

const ResponsiveTable = ({
  columns,
  dataSource,
  scroll,
  pagination = true,
  ...props
}) => {
  const { isMobile, isTablet } = useResponsive();

  // Adjust columns for mobile view
  const getResponsiveColumns = () => {
    if (!isMobile) return columns;

    return columns.map(column => ({
      ...column,
      ellipsis: true, // Enable ellipsis for text overflow
      width: undefined, // Remove fixed widths on mobile
    }));
  };

  // Configure responsive scroll
  const getResponsiveScroll = () => {
    if (isMobile) {
      return { x: '100%' }; // Enable horizontal scroll on mobile
    }
    if (isTablet) {
      return { x: '800px' }; // Set fixed scroll width on tablet
    }
    return scroll; // Use provided scroll settings on desktop
  };

  // Configure responsive pagination
  const getResponsivePagination = () => {
    if (!pagination) return false;

    return {
      size: isMobile ? 'small' : 'default',
      pageSize: isMobile ? 10 : (isTablet ? 15 : 20),
      ...(typeof pagination === 'object' ? pagination : {}),
    };
  };

  return (
    <Table
      columns={getResponsiveColumns()}
      dataSource={dataSource}
      scroll={getResponsiveScroll()}
      pagination={getResponsivePagination()}
      size={isMobile ? 'small' : 'middle'}
      {...props}
    />
  );
};

export default ResponsiveTable;
