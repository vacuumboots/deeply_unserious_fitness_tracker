// Main App Component - App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Register required Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [chartData, setChartData] = useState({});
  const [pushUpsChartData, setPushUpsChartData] = useState({});
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [monthlyPushUpsSummary, setMonthlyPushUpsSummary] = useState([]);
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

  const fetchPushUpsChartData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pullups/last7days');
      const data = response.data;
      if (!data || data.length === 0) {
        setPushUpsChartData({});
        return;
      }
      const labels = data.map(entry => entry.date);
      const pushUpsData = data.map(entry => entry.total_push_ups);

      setPushUpsChartData({
        labels,
        datasets: [
          {
            label: 'Push-Ups in Last 7 Days',
            data: pushUpsData,
            borderColor: 'rgba(255,99,132,1)',
            backgroundColor: 'rgba(255,99,132,0.2)',
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

  const fetchMonthlyPushUpsSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pullups/monthly');
      setMonthlyPushUpsSummary(response.data);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      throw error;
    }
  };

  const fetchAllData = async () => {
    await fetchChartData();
    await fetchPushUpsChartData();
    await fetchMonthlySummary();
    await fetchMonthlyPushUpsSummary();
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

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      try {
        await axios.post('http://localhost:5000/api/reset');
        alert('Database reset successfully');
        fetchAllData();
      } catch (error) {
        console.error('There was an error resetting the data!', error);
        alert('Error resetting data');
      }
    }
  };

  return (
    <div className="App container mt-5">
      <div className="card shadow p-4">
        <h1 className="text-center mb-4">Exercise Tracker</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label htmlFor="dateInput" className="form-label">Date:</label>
            <input
              type="date"
              id="dateInput"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="pullUpsInput" className="form-label">Pull-Ups:</label>
            <input
              type="number"
              id="pullUpsInput"
              className="form-control"
              value={pullUps}
              onChange={(e) => setPullUps(e.target.value)}
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="pushUpsInput" className="form-label">Push-Ups:</label>
            <input
              type="number"
              id="pushUpsInput"
              className="form-control"
              value={pushUps}
              onChange={(e) => setPushUps(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block mb-3">Submit</button>
        </form>
        <button onClick={() => window.location.href = 'http://localhost:5000/api/export'} className="btn btn-secondary btn-block mb-3">Export as CSV</button>
        <button onClick={handleReset} className="btn btn-danger btn-block mb-3">Reset Data</button>
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
              <div className="chart-container" style={{ height: '400px' }}>
                <Line data={chartData} />
              </div>
            ) : (
              <p className="text-center">No data available for the last 7 days.</p>
            )}
          </div>
          <div className="card shadow p-4 mt-5">
            <h2 className="text-center mb-4">Push-Ups Summary</h2>
            {pushUpsChartData && pushUpsChartData.labels && pushUpsChartData.labels.length > 0 ? (
              <div className="chart-container" style={{ height: '400px' }}>
                <Line data={pushUpsChartData} />
              </div>
            ) : (
              <p className="text-center">No data available for the last 7 days.</p>
            )}
          </div>
          <div className="card shadow p-4 mt-5">
            <h2 className="text-center mb-4">Monthly Pull-Ups Summary</h2>
            <ul className="list-group">
              {monthlySummary.map((entry, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  {entry.month}
                  <span className="badge bg-primary rounded-pill">{entry.total_pull_ups} Pull-Ups</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card shadow p-4 mt-5">
            <h2 className="text-center mb-4">Monthly Push-Ups Summary</h2>
            <ul className="list-group">
              {monthlyPushUpsSummary.map((entry, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  {entry.month}
                  <span className="badge bg-success rounded-pill">{entry.total_push_ups} Push-Ups</span>
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
