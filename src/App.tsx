import { useState } from 'react';
import salaryDataRaw from './salaries.json';

// Type assertion for the imported JSON
const salaryData = salaryDataRaw as Record<string, Record<string, number>>;

function App() {
  const [grade, setGrade] = useState<string>('');
  const [step, setStep] = useState<string>('');

  const grades = Object.keys(salaryData).sort((a, b) => parseInt(a) - parseInt(b));
  
  // Get steps for the selected grade
  const steps = grade ? Object.keys(salaryData[grade]).sort((a, b) => parseInt(a) - parseInt(b)) : [];

  const biWeeklySalary = (grade && step) ? salaryData[grade][step] : null;
  const annualSalary = biWeeklySalary ? (biWeeklySalary * 26.1).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : null;
  const formattedBiWeekly = biWeeklySalary ? biWeeklySalary.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : null;

  return (
    <div className="container mt-5">
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white text-center">
          <h1>Civil Buddy Salary Calculator</h1>
          <p className="mb-0">Suffolk County Civil Service</p>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {/* Grade Selection */}
            <div className="col-md-6">
              <label htmlFor="gradeSelect" className="form-label fw-bold">Select Grade</label>
              <select 
                id="gradeSelect" 
                className="form-select" 
                value={grade} 
                onChange={(e) => {
                  setGrade(e.target.value);
                  setStep(''); // Reset step when grade changes
                }}
              >
                <option value="">-- Choose Grade --</option>
                {grades.map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>

            {/* Step Selection */}
            <div className="col-md-6">
              <label htmlFor="stepSelect" className="form-label fw-bold">Select Step</label>
              <select 
                id="stepSelect" 
                className="form-select" 
                value={step} 
                onChange={(e) => setStep(e.target.value)}
                disabled={!grade}
              >
                <option value="">-- Choose Step --</option>
                {steps.map(s => (
                  <option key={s} value={s}>Step {s}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="my-4"/>

          {/* Results Display */}
          {biWeeklySalary !== null ? (
            <div className="alert alert-success text-center">
              <h4 className="alert-heading">Salary Estimate</h4>
              <div className="row mt-3">
                <div className="col-md-6 mb-2">
                  <div className="card border-success h-100">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2 text-muted">Bi-Weekly</h6>
                      <h2 className="card-title text-success">{formattedBiWeekly}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-2">
                  <div className="card border-primary h-100">
                    <div className="card-body">
                      <h6 className="card-subtitle mb-2 text-muted">Annual (approx. 26.1 pay periods)</h6>
                      <h2 className="card-title text-primary">{annualSalary}</h2>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted p-4">
              <p>Please select a Grade and Step to see the salary details.</p>
            </div>
          )}
        </div>
        <div className="card-footer text-muted text-center text-small">
          <small>Data based on 2024 Salary Schedule. For informational purposes only.</small>
        </div>
      </div>
    </div>
  );
}

export default App;