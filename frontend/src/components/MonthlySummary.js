// MonthlySummary Component - components/MonthlySummary.js
import React from 'react';

function MonthlySummary({ monthlySummary }) {
  return (
    <div className="card shadow p-4 mt-5">
      <h2 className="text-center mb-4">Monthly Pull-Ups Summary</h2>
      <ul className="list-group">
        {monthlySummary.map((entry, index) => (
          <li key={index} className="list-group-item">
            {entry.month}: {entry.total_pull_ups} Pull-Ups
          </li>
        ))}
      </ul>
    </div>
  );
}

export { MonthlySummary };