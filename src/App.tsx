import { useState, useMemo } from 'react';
import Select from 'react-select';
import salaryDataRaw from './salaries.json';
import titleDataRaw from './titles.json';
import 'bootstrap/dist/css/bootstrap.min.css';

// Types
type SalaryData = Record<string, Record<string, number>>;
type TitleData = { title: string; grade: string | number; spec: number };

const salaryData = salaryDataRaw as SalaryData;
const titleData = titleDataRaw as TitleData[];

// Constants (Defaults based on analysis)
const PAY_PERIODS = 26.1;
const DEFAULT_HOLIDAYS = 13;
const DEFAULT_HOLIDAY_MULTIPLIER = 1.5;
const DEFAULT_EVE_DIFF = 0.06; // 6%
const DEFAULT_NIGHT_DIFF = 0.10; // 10%

function App() {
  const [selectedTitle, setSelectedTitle] = useState<{ value: string; label: string; grade: string; spec: number } | null>(null);
  const [manualGrade, setManualGrade] = useState<string>('');
  
  // Settings State
  const [holidays, setHolidays] = useState(DEFAULT_HOLIDAYS);
  const [eveDiff, setEveDiff] = useState(DEFAULT_EVE_DIFF * 100);
  const [nightDiff, setNightDiff] = useState(DEFAULT_NIGHT_DIFF * 100);

  // Prepare options for Select
  const options = useMemo(() => titleData.map(t => ({
    value: t.title,
    label: `${t.title} (Grade ${t.grade})`,
    grade: String(t.grade),
    spec: t.spec
  })), []);

  // Determine current grade (from title or manual override)
  const currentGrade = selectedTitle ? selectedTitle.grade : manualGrade;

  // Get steps for the grade
  const steps = useMemo(() => {
    if (!currentGrade || !salaryData[currentGrade]) return [];
    // Sort steps: S, 1, 2, ... 15 (Handle 'S' as 0 for sorting)
    return Object.keys(salaryData[currentGrade]).sort((a, b) => {
        if (a === 'S') return -1;
        if (b === 'S') return 1;
        return parseInt(a) - parseInt(b);
    });
  }, [currentGrade]);

  const formatCurrency = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="container my-5">
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white">
          <h2 className="mb-0">Civil Buddy Salary Calculator</h2>
          <small>Suffolk County Civil Service</small>
        </div>
        
        <div className="card-body">
          {/* Controls */}
          <div className="row g-3 mb-4">
            <div className="col-md-8">
              <label className="form-label fw-bold">Select Job Title</label>
              <Select 
                options={options} 
                onChange={setSelectedTitle}
                placeholder="Search for a job title..."
                isClearable
                className="text-dark"
              />
            </div>
            <div className="col-md-4">
               <label className="form-label fw-bold">Grade</label>
               <input 
                 type="text" 
                 className="form-control" 
                 value={currentGrade} 
                 onChange={(e) => {
                   setManualGrade(e.target.value);
                   setSelectedTitle(null);
                 }}
                 placeholder="Or enter Grade manually"
               />
            </div>
          </div>

          {/* Settings Toggle */}
          <details className="mb-4">
            <summary className="text-primary fw-bold cursor-pointer">Advanced Settings (Differentials & Holidays)</summary>
            <div className="card card-body mt-2 bg-light">
              <div className="row g-3">
                 <div className="col-md-4">
                   <label className="form-label">Evening Diff (%)</label>
                   <input type="number" className="form-control" value={eveDiff} onChange={e => setEveDiff(Number(e.target.value))} />
                 </div>
                 <div className="col-md-4">
                   <label className="form-label">Night Diff (%)</label>
                   <input type="number" className="form-control" value={nightDiff} onChange={e => setNightDiff(Number(e.target.value))} />
                 </div>
                 <div className="col-md-4">
                   <label className="form-label">Paid Holidays (Days)</label>
                   <input type="number" className="form-control" value={holidays} onChange={e => setHolidays(Number(e.target.value))} />
                 </div>
              </div>
            </div>
          </details>

          {/* Results Table */}
          {currentGrade && steps.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped table-hover table-bordered text-center align-middle">
                <thead className="table-dark">
                  <tr>
                    <th rowSpan={2}>Step</th>
                    <th colSpan={2}>Base Pay</th>
                    <th colSpan={2}>Evening ({eveDiff}%)</th>
                    <th colSpan={2}>Night ({nightDiff}%)</th>
                  </tr>
                  <tr>
                    <th>Bi-Weekly</th>
                    <th>Annual</th>
                    <th>Bi-Weekly</th>
                    <th>Annual (+Hol)</th>
                    <th>Bi-Weekly</th>
                    <th>Annual (+Hol)</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map(step => {
                    const baseBiWeekly = salaryData[currentGrade][step];
                    const baseAnnual = baseBiWeekly * PAY_PERIODS;
                    
                    const dailyRate = baseBiWeekly / 10;
                    const holidayPayTotal = dailyRate * DEFAULT_HOLIDAY_MULTIPLIER * holidays;

                    // Evening
                    const eveBiWeekly = baseBiWeekly * (1 + (eveDiff / 100));
                    const eveAnnual = (eveBiWeekly * PAY_PERIODS);
                    const eveAnnualWithHol = eveAnnual + holidayPayTotal; // Holidays are usually added to total comp

                    // Night
                    const nightBiWeekly = baseBiWeekly * (1 + (nightDiff / 100));
                    const nightAnnual = (nightBiWeekly * PAY_PERIODS);
                    const nightAnnualWithHol = nightAnnual + holidayPayTotal;

                    return (
                      <tr key={step}>
                        <td className="fw-bold">{step}</td>
                        <td className="bg-white">{formatCurrency(baseBiWeekly)}</td>
                        <td className="fw-bold text-primary">{formatCurrency(baseAnnual)}</td>
                        
                        <td>{formatCurrency(eveBiWeekly)}</td>
                        <td className="text-success">{formatCurrency(eveAnnualWithHol)}</td>
                        
                        <td>{formatCurrency(nightBiWeekly)}</td>
                        <td className="text-success">{formatCurrency(nightAnnualWithHol)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="alert alert-info text-center">
               Please select a Job Title or enter a Grade to view the salary schedule.
             </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
