// Main App Component - Updated App.js with User Authentication
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Calendar, Activity, Download, RefreshCcw, Flame, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);

  // User input states
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Data states
  const [chartData, setChartData] = useState({});
  const [pushUpsChartData, setPushUpsChartData] = useState({});
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [monthlyPushUpsSummary, setMonthlyPushUpsSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Exercise input states
  const [date, setDate] = useState('');
  const [pullUps, setPullUps] = useState(0);
  const [pushUps, setPushUps] = useState(0);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Base URL for API endpoints
  const API_BASE_URL = '/api';

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/register`, { username, password });
      alert('Registration successful. You can now log in.');
      setIsRegistering(false);
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.response?.data?.error || 'Registration failed.');
    }
  };

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
      const receivedToken = response.data.token;
      setToken(receivedToken);
      setIsAuthenticated(true);
      // Optionally store the token in localStorage
      // localStorage.setItem('token', receivedToken);
    } catch (error) {
      console.error('Login error:', error);
      alert(error.response?.data?.error || 'Login failed.');
    }
  };

  // Handle user logout
  const handleLogout = () => {
    setToken(null);
    setIsAuthenticated(false);
    // localStorage.removeItem('token');
    setUsername('');
    setPassword('');
  };

  // Fetch all data when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
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
  }, [isAuthenticated, token]);

  // Fetch chart data for pull-ups
  const fetchChartData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pullups/last7days`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (!data || data.length === 0) {
        setChartData({});
        return;
      }
      const labels = data.map((entry) => entry.date);
      const pullUpsData = data.map((entry) => entry.total_pull_ups);

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

  // Fetch chart data for push-ups
  const fetchPushUpsChartData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pullups/last7days`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      if (!data || data.length === 0) {
        setPushUpsChartData({});
        return;
      }
      const labels = data.map((entry) => entry.date);
      const pushUpsData = data.map((entry) => entry.total_push_ups);

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
      console.error('Error fetching push-ups chart data:', error);
      throw error;
    }
  };

  // Fetch monthly summaries
  const fetchMonthlySummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pullups/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMonthlySummary(response.data);
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      throw error;
    }
  };

  const fetchMonthlyPushUpsSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pullups/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMonthlyPushUpsSummary(response.data);
    } catch (error) {
      console.error('Error fetching monthly push-ups summary:', error);
      throw error;
    }
  };

  // Add this new function
const fetchStreakData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/streak`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCurrentStreak(response.data.current_streak);
    setLongestStreak(response.data.longest_streak);
  } catch (error) {
    console.error('Error fetching streak data:', error);
  }
};

  // Fetch all necessary data
  const fetchAllData = async () => {
    await fetchChartData();
    await fetchPushUpsChartData();
    await fetchMonthlySummary();
    await fetchMonthlyPushUpsSummary();
    await fetchStreakData();
  };

  // Handle exercise data submission
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
      
      // Capture the response here
      const response = await axios.post(
        `${API_BASE_URL}/submit`,
        { date, pull_ups: pullUpsInt, push_ups: pushUpsInt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.data.current_streak !== undefined) {
        setCurrentStreak(response.data.current_streak);
        setLongestStreak(response.data.longest_streak);
      }
      
      alert('Data submitted successfully');
      fetchAllData();
    } catch (error) {
      console.error('There was an error submitting the data!', error);
      alert(error.response?.data?.error || 'Error submitting data.');
    }
  };

  // Handle data reset
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all your data? This action cannot be undone.')) {
      try {
        await axios.post(
          `${API_BASE_URL}/reset`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Your data has been reset successfully');
        fetchAllData();
      } catch (error) {
        console.error('There was an error resetting the data!', error);
        alert(error.response?.data?.error || 'Error resetting data');
      }
    }
  };

  // Handle token expiration
  useEffect(() => {
    if (token) {
      const decoded = jwt_decode(token);
      if (decoded.exp * 1000 < Date.now()) {
        handleLogout();
        alert('Session has expired. Please log in again.');
      }
    }
  }, [token]);

  // Authentication forms
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center">{isRegistering ? 'Register' : 'Login'}</h2>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </form>
          <div className="text-center">
            {isRegistering ? (
              <p>
                Already have an account?{' '}
                <button onClick={() => setIsRegistering(false)} className="text-blue-500">
                  Login here
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setIsRegistering(true)} className="text-blue-500">
                  Register here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main application UI
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
              onClick={() => {
                window.location.href = `${API_BASE_URL}/export`;
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              <Download size={20} /> Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
            >
              Logout
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="date"
                      className="pl-10 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pull-Ups</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={pullUps}
                      onChange={(e) => setPullUps(e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Push-Ups</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={pushUps}
                      onChange={(e) => setPushUps(e.target.value)}
                      min="0"
                      required
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

          {/* Workout Streaks Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="text-orange-500" /> {/* Import Flame from lucide-react */}
                Workout Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentStreak}
                  </div>
                  <div className="text-sm text-orange-600/80">
                    Current Streak
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {longestStreak}
                  </div>
                  <div className="text-sm text-purple-600/80">
                    Longest Streak
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {currentStreak > 0 ? (
                    <>
                      <Flame className="text-orange-500" size={20} />
                      <span className="text-gray-600">
                        {currentStreak === 1 
                          ? "1 day streak! Keep it up!" 
                          : `${currentStreak} days streak! You're on fire!`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Info className="text-gray-500" size={20} />
                      <span className="text-gray-600">
                        Start your streak by logging your workout today!
                      </span>
                    </>
                  )}
                </div>
                {longestStreak > currentStreak && (
                  <div className="mt-2 text-sm text-gray-500">
                    Personal best: {longestStreak} days
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <p className="text-center text-gray-500">
                  {loading ? 'Loading data...' : 'No data available for the last 7 days.'}
                </p>
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
                <p className="text-center text-gray-500">
                  {loading ? 'Loading data...' : 'No data available for the last 7 days.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Pull-Ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monthlySummary.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
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
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
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
