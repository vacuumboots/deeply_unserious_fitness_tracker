// ExerciseForm Component - components/ExerciseForm.js

import React, { useState } from 'react';
import axios from 'axios';

function ExerciseForm({ onSubmissionSuccess }) {
  const [date, setDate] = useState("");
  const [pullUps, setPullUps] = useState(0);
  const [pushUps, setPushUps] = useState(0);

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
      await axios.post('http://localhost:5000/api/submit', { date, pull_ups: pullUps, push_ups: pushUps });
      alert('Data submitted successfully');
      onSubmissionSuccess();
    } catch (error) {
      console.error('There was an error submitting the data!', error);
    }
  };

  return (
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
  );
}
