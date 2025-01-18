import React from 'react';
import { Table } from 'antd';
import { useResponsive } from '../../hooks/useResponsive';
import './ResponsiveTable.css';

const ResponsiveTable = ({ columns, ...props }) => {
  const { isMobile } = useResponsive();

  // Modify columns for mobile view
  const mobileColumns = columns.map(column => ({
    ...column,
    ellipsis: isMobile,
    width: isMobile ? undefined : column.width,
  }));

  return (
    <div className="responsive-table-wrapper">
      <Table
        {...props}
        columns={mobileColumns}
        scroll={{ x: 'max-content' }}
        size={isMobile ? 'small' : 'middle'}
      />
    </div>
  );
};

export default ResponsiveTable;
