import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import salaryDataRaw from './salaries.json';
import titleDataRaw from './titles.json';
import 'bootstrap/dist/css/bootstrap.min.css';

// Types
type SalaryData = Record<string, Record<string, number>>;
type TitleData = { title: string; grade: string | number; spec: number };

const salaryData = salaryDataRaw as SalaryData;
const titleData = titleDataRaw as TitleData[];

// Constants
const PAY_PERIODS = 26.1;
const DEFAULT_HOLIDAYS = 13; // Can be adjusted
const HOLIDAY_RATE_MULTIPLIER = 1.5;

function App() {
  // Selection State
  const [selectedTitle, setSelectedTitle] = useState<{ value: string; label: string; grade: string } | null>(null);
  const [step, setStep] = useState<string>('0'); // Default to Step 0 (S)
  
  // Modifiers State
  const [differential, setDifferential] = useState<number>(0); // 0, 0.06, or 0.10
  const [includeHolidays, setIncludeHolidays] = useState<boolean>(false);

  // Derived State
  const currentGrade = selectedTitle ? String(selectedTitle.grade) : null;
  
  // Available Steps for the selected Grade
  const steps = useMemo(() => {
    if (!currentGrade || !salaryData[currentGrade]) return [];
    // Sort steps numerically, treating 'S' as 0
    return Object.keys(salaryData[currentGrade]).sort((a, b) => {
        const valA = a === 'S' ? 0 : parseInt(a);
        const valB = b === 'S' ? 0 : parseInt(b);
        return valA - valB;
    });
  }, [currentGrade]);

  // Reset step to '0' (S) when Grade changes
  useEffect(() => {
    if (steps.includes('S')) setStep('S');
    else if (steps.includes('0')) setStep('0');
    else if (steps.length > 0) setStep(steps[0]);
  }, [currentGrade, steps]);

  // Calculations
  const baseBiWeekly = (currentGrade && step && salaryData[currentGrade] && salaryData[currentGrade][step]) 
    ? salaryData[currentGrade][step] 
    : 0;

  // Apply Differential
  const biWeeklyWithDiff = baseBiWeekly * (1 + differential);
  
  // Calculate Annual Base (with Diff)
  const annualWithDiff = biWeeklyWithDiff * PAY_PERIODS;

  // Calculate Holiday Pay
  // Formula: (BaseBiWeekly / 10) * 1.5 * 13
  // Note: Differentials usually apply to holiday pay too? 
  // If you work the holiday, you get your normal pay (with diff) + holiday pay (1.5x).
  // Assuming the "Holiday" checkbox means "Add the extra holiday pay check amount to the annual total".
  
  // Using Base for Holiday calculation (standard) or With Diff? 
  // Usually, Holiday Pay is based on the daily rate including differential if it's a permanent shift.
  // I will use the rate *with* differential to be safe, as night shift workers get night rate for holidays.
  const dailyRate = biWeeklyWithDiff / 10;
  const holidayPayTotal = includeHolidays ? (dailyRate * HOLIDAY_RATE_MULTIPLIER * DEFAULT_HOLIDAYS) : 0;

  const finalAnnual = annualWithDiff + holidayPayTotal;

  // Formatting
  const formatMoney = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Select Options
  const titleOptions = useMemo(() => titleData.map(t => ({
    value: t.title,
    label: `${t.title}`,
    grade: String(t.grade)
  })), []);

  return (
    <div className="container mt-5" style={{ maxWidth: '800px' }}>
      <div className="card shadow border-0">
        <div className="card-header bg-dark text-white text-center py-4">
          <h2 className="mb-0 fw-bold">Civil Buddy</h2>
          <p className="mb-0 opacity-75">Suffolk County Salary Calculator</p>
        </div>
        
        <div className="card-body p-4">
          
          {/* 1. Job Title Select */}
          <div className="mb-4">
            <label className="form-label fw-bold">Job Title</label>
            <Select 
              options={titleOptions} 
              onChange={setSelectedTitle}
              placeholder="Search for your title..."
              isClearable
              className="basic-single"
              classNamePrefix="select"
            />
            {currentGrade && <small className="text-muted">Grade: {currentGrade}</small>}
          </div>

          {/* 2. Step, Diff, Holiday Row */}
          <div className="row g-3 mb-4">
            
            {/* Step Selection */}
            <div className="col-md-4">
              <label className="form-label fw-bold">Step</label>
              <select 
                className="form-select" 
                value={step} 
                onChange={(e) => setStep(e.target.value)}
                disabled={!currentGrade}
              >
                {steps.map(s => (
                  <option key={s} value={s}>
                    {s === '0' || s === 'S' ? 'Step S (Starting)' : `Step ${s}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Differential Selection */}
            <div className="col-md-5">
              <label className="form-label fw-bold">Differential</label>
              <div className="btn-group w-100 mb-1" role="group">
                <input 
                  type="radio" 
                  className="btn-check" 
                  name="diff" 
                  id="diffNone" 
                  checked={differential === 0} 
                  onChange={() => setDifferential(0)} 
                />
                <label className="btn btn-outline-secondary" htmlFor="diffNone">None</label>

                <input 
                  type="radio" 
                  className="btn-check" 
                  name="diff" 
                  id="diffEve" 
                  checked={differential === 0.06} 
                  onChange={() => setDifferential(0.06)} 
                />
                <label className="btn btn-outline-secondary" htmlFor="diffEve">6%</label>

                <input 
                  type="radio" 
                  className="btn-check" 
                  name="diff" 
                  id="diffNight" 
                  checked={differential === 0.10} 
                  onChange={() => setDifferential(0.10)} 
                />
                <label className="btn btn-outline-secondary" htmlFor="diffNight">10%</label>
              </div>
              <small className="text-muted d-block" style={{ fontSize: '0.75rem', lineHeight: '1.1' }}>
                {differential === 0.06 && "6%: 2 weeks days / 1 week nights (SCPD pattern)"}
                {differential === 0.10 && "10%: Steady midnight shifts"}
                {differential === 0 && "No shift differential applied"}
              </small>
            </div>

            {/* Holiday Toggle */}
            <div className="col-md-3">
               <label className="form-label fw-bold d-block">Holidays</label>
               <div className="form-check form-switch mt-2">
                 <input 
                   className="form-check-input" 
                   type="checkbox" 
                   id="holidaySwitch"
                   checked={includeHolidays}
                   onChange={(e) => setIncludeHolidays(e.target.checked)}
                 />
                 <label className="form-check-label" htmlFor="holidaySwitch">Include</label>
               </div>
            </div>
          </div>

          <hr className="my-4" />

          {/* 3. Big Result Display */}
          <div className="text-center">
            {currentGrade ? (
               <div className="row justify-content-center">
                 <div className="col-md-6 mb-3">
                   <div className="card h-100 border-primary bg-light">
                     <div className="card-body">
                       <h6 className="text-uppercase text-muted fw-bold">Bi-Weekly Gross</h6>
                       <h2 className="display-6 fw-bold text-primary mb-0">{formatMoney(biWeeklyWithDiff)}</h2>
                       {differential > 0 && <small className="text-success">Includes {differential * 100}% Diff</small>}
                     </div>
                   </div>
                 </div>

                 <div className="col-md-6 mb-3">
                   <div className="card h-100 border-success bg-light">
                     <div className="card-body">
                       <h6 className="text-uppercase text-muted fw-bold">Annual Gross</h6>
                       <h2 className="display-6 fw-bold text-success mb-0">{formatMoney(finalAnnual)}</h2>
                       {includeHolidays && <small className="text-muted d-block">+ Holiday Pay Included</small>}
                     </div>
                   </div>
                 </div>
               </div>
            ) : (
              <div className="text-muted py-4">
                <p className="mb-0">Select a Job Title above to see salary details.</p>
              </div>
            )}
          </div>

        </div>
        <div className="card-footer bg-white text-center text-muted">
           <small>Rates effective Jan 2024. Standard 26.1 Pay Periods.</small>
        </div>
      </div>
    </div>
  )
}

export default App;