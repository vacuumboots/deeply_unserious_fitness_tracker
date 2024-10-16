// Main App Component - App.js with Simple Authentication
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Calendar, Activity, BarChart2, Download, RefreshCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [chartData, setChartData] = useState({});
  const [pushUpsChartData, setPushUpsChartData] = useState({});
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [monthlyPushUpsSummary, setMonthlyPushUpsSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState("");
  const [pullUps, setPullUps] = useState(0);
  const [pushUps, setPushUps] = useState(0);

  const hardcodedUsername = "admin";
  const hardcodedPassword = "password123";

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === hardcodedUsername && password === hardcodedPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Invalid username or password");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
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
    }
  }, [isAuthenticated]);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center">Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fitness Tracker</h1>
            <p className="text-gray-500 mt-1">Track your daily exercises</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.href = 'http://localhost:5000/api/export'} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              <Download size={20} /> Export CSV
            </button>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="text-blue-500" />
                Log Exercise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="date"
                      className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pull-Ups
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={pullUps}
                      onChange={(e) => setPullUps(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Push-Ups
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={pushUps}
                      onChange={(e) => setPushUps(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Log Exercise
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Pull-Ups Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && chartData.labels && chartData.labels.length > 0 ? (
                <div className="chart-container">
                  <Line data={chartData} />
                </div>
              ) : (
                <p className="text-center text-gray-500">No data available for the last 7 days.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push-Ups Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {pushUpsChartData && pushUpsChartData.labels && pushUpsChartData.labels.length > 0 ? (
                <div className="chart-container">
                  <Line data={pushUpsChartData} />
                </div>
              ) : (
                <p className="text-center text-gray-500">No data available for the last 7 days.</p>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summaries */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Pull-Ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monthlySummary.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{entry.month}</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {entry.total_pull_ups} Pull-Ups
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Push-Ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monthlyPushUpsSummary.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{entry.month}</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {entry.total_push_ups} Push-Ups
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reset Data Button */}
        <div className="flex justify-center">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
          >
            <RefreshCcw size={20} /> Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
