import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import salaryDataRaw from '../salaries.json';
import titleDataRaw from '../titles.json';

// Types
type SalaryData = Record<string, Record<string, number>>;
type TitleData = { title: string; grade: string | number; spec: number };

const salaryData = salaryDataRaw as SalaryData;
const titleData = titleDataRaw as TitleData[];

// Constants
const PAY_PERIODS = 26.1;
const HOLIDAYS = 13;
const HOLIDAY_RATE_MULTIPLIER = 1.5;
const EVE_DIFF = 0.06;   // 6%
const NIGHT_DIFF = 0.10; // 10%

export default function SalaryVerification() {
  const [selectedTitle, setSelectedTitle] = useState<{ value: string; label: string; grade: string; spec: number } | null>(null);
  const [step, setStep] = useState<string>('S');

  // Derived Data
  const currentGrade = selectedTitle ? String(selectedTitle.grade) : null;
  
  // Available Steps
  const steps = useMemo(() => {
    if (!currentGrade || !salaryData[currentGrade]) return [];
    return Object.keys(salaryData[currentGrade]).sort((a, b) => {
        const valA = a === 'S' ? 0 : parseInt(a);
        const valB = b === 'S' ? 0 : parseInt(b);
        return valA - valB;
    });
  }, [currentGrade]);

  // Default to Step S
  useEffect(() => {
    if (steps.includes('S')) setStep('S');
    else if (steps.includes('0')) setStep('0');
  }, [currentGrade, steps]);

  const formatMoney = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const titleOptions = useMemo(() => titleData.map(t => ({
    value: t.title,
    label: t.title,
    grade: String(t.grade),
    spec: t.spec
  })), []);

  // Calculation Helper
  const calculateRow = (base: number, diffPercent: number) => {
    const biWeekly = base * (1 + diffPercent);
    const annualBase = biWeekly * PAY_PERIODS;
    const dailyRate = biWeekly / 10;
    const holidayPay = dailyRate * HOLIDAY_RATE_MULTIPLIER * HOLIDAYS;
    return {
      biWeekly,
      annualBase,
      annualWithHol: annualBase + holidayPay
    };
  };

  const baseSalary = (currentGrade && step && salaryData[currentGrade]) ? salaryData[currentGrade][step] : 0;
  
  const results = baseSalary ? {
    none: calculateRow(baseSalary, 0),
    eve: calculateRow(baseSalary, EVE_DIFF),
    night: calculateRow(baseSalary, NIGHT_DIFF)
  } : null;

  return (
    <div className="container mt-4" style={{ maxWidth: '900px' }}>
      <div className="card shadow-lg border-0">
        <div className="card-header bg-primary text-white text-center py-4">
          <h2 className="mb-0 fw-bold">Salary Verification</h2>
          <p className="mb-0 opacity-75">Check rates for specific titles and steps</p>
        </div>
        
        <div className="card-body p-4">
          <div className="row g-3 mb-4 align-items-end">
            <div className="col-md-8">
              <label className="form-label fw-bold">Select Title</label>
              <Select 
                options={titleOptions} 
                onChange={setSelectedTitle}
                placeholder="Search Title..."
                isClearable
                className="basic-single"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">Step</label>
              <select 
                className="form-select border-primary" 
                value={step} 
                onChange={(e) => setStep(e.target.value)}
                disabled={!currentGrade}
              >
                {steps.map(s => (
                  <option key={s} value={s}>
                    {s === 'S' || s === '0' ? 'Step S (Starting)' : `Step ${s}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTitle && (
            <div className="alert alert-light border mb-4 d-flex justify-content-between align-items-center">
              <div>
                <span className="badge bg-secondary me-2">Spec #{selectedTitle.spec}</span>
                <span className="fw-bold text-uppercase">{selectedTitle.value}</span>
              </div>
              <div className="h4 mb-0 text-primary">Grade {selectedTitle.grade}</div>
            </div>
          )}

          {results ? (
            <div className="table-responsive">
              <table className="table table-bordered align-middle text-center shadow-sm">
                <thead className="table-dark">
                  <tr>
                    <th>Differential</th>
                    <th>Bi-Weekly</th>
                    <th>Annual (Base)</th>
                    <th className="bg-success">Annual + Holidays</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold">None</td>
                    <td>{formatMoney(results.none.biWeekly)}</td>
                    <td>{formatMoney(results.none.annualBase)}</td>
                    <td className="fw-bold text-success">{formatMoney(results.none.annualWithHol)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Evening (6%) <br/><small className="text-muted fw-normal">Rotating/Eve</small></td>
                    <td>{formatMoney(results.eve.biWeekly)}</td>
                    <td>{formatMoney(results.eve.annualBase)}</td>
                    <td className="fw-bold text-success">{formatMoney(results.eve.annualWithHol)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Night (10%) <br/><small className="text-muted fw-normal">Steady Midnights</small></td>
                    <td>{formatMoney(results.night.biWeekly)}</td>
                    <td>{formatMoney(results.night.annualBase)}</td>
                    <td className="fw-bold text-success">{formatMoney(results.night.annualWithHol)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-muted small mt-2">
                * Holiday calculation based on {HOLIDAYS} days at {HOLIDAY_RATE_MULTIPLIER}x daily rate.
                Annual base assumes {PAY_PERIODS} pay periods.
              </p>
            </div>
          ) : (
            <div className="text-center py-5 text-muted bg-light rounded">
              <h5>Please select a Job Title to see salary details.</h5>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
