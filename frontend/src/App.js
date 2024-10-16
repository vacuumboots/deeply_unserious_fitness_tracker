// Main App Component - App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';

// Register required Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [chartData, setChartData] = useState({});
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState("");
  const [pullUps, setPullUps] = useState(0);
  const [pushUps, setPushUps] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchAllData();
      } catch (error) {
        setError('Error fetching data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pullups/last7days');
      const data = response.data;
      if (!data || data.length === 0) {
        setChartData({});
        return;
      }
      const labels = data.map(entry => entry.date);
      const pullUpsData = data.map(entry => entry.total_pull_ups);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Pull-Ups in Last 7 Days',
            data: pullUpsData,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            fill: true,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pullups/monthly');
      setMonthlySummary(response.data);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      throw error;
    }
  };

  const fetchAllData = async () => {
    await fetchChartData();
    await fetchMonthlySummary();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) {
      alert('Please enter a valid date.');
      return;
    }
    if (pullUps < 0 || pushUps < 0) {
      alert('Pull-ups and Push-ups values must be non-negative.');
      return;
    }
    try {
      const pullUpsInt = parseInt(pullUps, 10);
      const pushUpsInt = parseInt(pushUps, 10);

      await axios.post('http://localhost:5000/api/submit', { date, pull_ups: pullUpsInt, push_ups: pushUpsInt });
      alert('Data submitted successfully');
      fetchAllData();
    } catch (error) {
      console.error('There was an error submitting the data!', error);
    }
  };

  return (
    <div className="App container mt-5">
      <div className="card shadow p-4">
        <h1 className="text-center mb-4">Exercise Tracker</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label>Date:</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group mb-3">
            <label>Pull-Ups:</label>
            <input
              type="number"
              className="form-control"
              value={pullUps}
              onChange={(e) => setPullUps(e.target.value)}
            />
          </div>
          <div className="form-group mb-3">
            <label>Push-Ups:</label>
            <input
              type="number"
              className="form-control"
              value={pushUps}
              onChange={(e) => setPushUps(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block mb-3">Submit</button>
        </form>
        <button onClick={() => window.location.href = 'http://localhost:5000/api/export'} className="btn btn-secondary btn-block mb-3">Export as CSV</button>
      </div>

      {loading ? (
        <p className="text-center mt-5">Loading...</p>
      ) : error ? (
        <p className="text-center mt-5 text-danger">{error}</p>
      ) : (
        <>
          <div className="card shadow p-4 mt-5">
            <h2 className="text-center mb-4">Pull-Ups Summary</h2>
            {chartData && chartData.labels && chartData.labels.length > 0 ? (
              <Line data={chartData} />
            ) : (
              <p className="text-center">No data available for the last 7 days.</p>
            )}
          </div>
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
        </>
      )}
    </div>
  );
}

export default App;
