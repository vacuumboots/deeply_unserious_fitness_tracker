// WeeklyChart Component - components/WeeklyChart.js
import React from 'react';
import { Line } from 'react-chartjs-2';

function WeeklyChart({ chartData }) {
  return (
    <div className="card shadow p-4 mt-5">
      <h2 className="text-center mb-4">Pull-Ups Summary</h2>
      {chartData && chartData.labels && chartData.labels.length > 0 ? (
        <Line data={chartData} />
      ) : (
        <p className="text-center">No data available for the last 7 days.</p>
      )}
    </div>
  );
}

export { WeeklyChart };