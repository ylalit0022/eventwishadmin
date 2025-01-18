import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import './DataTable.styles.css';

const DataTable = ({ columns, data, cardView = true }) => {
  const { isMobile } = useResponsive();

  // Render table view
  const renderTable = () => (
    <div className="responsive-table-container">
      <table className="responsive-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={`${rowIndex}-${column.key}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render card view for mobile
  const renderCards = () => (
    <div className="responsive-table-cards">
      {data.map((row, rowIndex) => (
        <div key={rowIndex} className="responsive-table-card">
          {columns.map((column) => (
            <div key={`${rowIndex}-${column.key}`} className="responsive-table-card-row">
              <div className="card-label">{column.title}</div>
              <div className="card-value">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="data-table">
      {isMobile && cardView ? renderCards() : renderTable()}
    </div>
  );
};

export default DataTable;
