import { useState, useMemo } from 'react';
import Select from 'react-select';
import salaryDataRaw from '../salaries.json';
import titleDataRaw from '../titles.json';

// Types
type SalaryData = Record<string, Record<string, number>>;
type TitleData = { title: string; grade: string | number; spec: number };

const salaryData = salaryDataRaw as SalaryData;
const titleData = titleDataRaw as TitleData[];
const PROMO_RAISE_PERCENT = 0.03; // 3% Guarantee
const PAY_PERIODS = 26.1;

export default function PromotionCalculator() {
  // Inputs
  const [currentTitle, setCurrentTitle] = useState<{ value: string; label: string; grade: string } | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('S');
  const [newTitle, setNewTitle] = useState<{ value: string; label: string; grade: string } | null>(null);
  const [promoDate, setPromoDate] = useState<string>(new Date().toISOString().slice(0, 10)); // Default Today

  // Filter options to only include titles with valid salary data
  const titleOptions = useMemo(() => {
    return titleData
      .filter(t => salaryData[String(t.grade)]) // Only keep titles we have data for
      .map(t => ({
        value: t.title,
        label: `${t.title} (Gr ${t.grade})`,
        grade: String(t.grade),
        spec: t.spec
      }));
  }, []);

  // Helpers
  const getSteps = (grade: string) => {
    if (!grade || !salaryData[grade]) return [];
    return Object.keys(salaryData[grade]).sort((a, b) => {
        const valA = a === 'S' ? 0 : parseInt(a);
        const valB = b === 'S' ? 0 : parseInt(b);
        return valA - valB;
    });
  };

  const currentSteps = useMemo(() => currentTitle ? getSteps(currentTitle.grade) : [], [currentTitle]);

  // CALCULATION LOGIC
  const calculation = useMemo(() => {
    if (!currentTitle || !newTitle || !currentStep) return null;

    const currentGrade = currentTitle.grade;
    const newGrade = newTitle.grade;
    
    // Safety check
    if (!salaryData[currentGrade] || !salaryData[newGrade]) return null;

    const currentBaseSalary = salaryData[currentGrade][currentStep];
    
    // 1. Check Date Logic (July 1st)
    const pDate = new Date(promoDate);
    const julyFirst = new Date(pDate.getFullYear(), 6, 1); // Month is 0-indexed (6 = July)
    
    let simulatedStep = currentStep;
    let adjustedBaseSalary = currentBaseSalary;
    let stepIncreaseApplied = false;

    // If Promo is ON or AFTER July 1st, simulate step increase (if not maxed)
    if (pDate >= julyFirst) {
        // Find next step
        const stepIndex = currentSteps.indexOf(currentStep);
        if (stepIndex !== -1 && stepIndex < currentSteps.length - 1) {
            simulatedStep = currentSteps[stepIndex + 1];
            adjustedBaseSalary = salaryData[currentGrade][simulatedStep];
            stepIncreaseApplied = true;
        }
    }

    // 2. Minimum Target
    const targetSalary = adjustedBaseSalary * (1 + PROMO_RAISE_PERCENT);

    // 3. Find New Step
    const newGradeSteps = getSteps(newGrade);
    let foundStep = null;
    let foundSalary = 0;

    for (const s of newGradeSteps) {
        const sal = salaryData[newGrade][s];
        if (sal >= targetSalary) {
            foundStep = s;
            foundSalary = sal;
            break;
        }
    }

    // Fallback if off chart (Max)
    if (!foundStep && newGradeSteps.length > 0) {
        foundStep = newGradeSteps[newGradeSteps.length - 1] + " (Max)";
        foundSalary = salaryData[newGrade][newGradeSteps[newGradeSteps.length - 1]];
    }

    return {
        currentBase: currentBaseSalary,
        adjustedBase: adjustedBaseSalary,
        stepIncreaseApplied,
        target: targetSalary,
        newStep: foundStep,
        newSalary: foundSalary,
        raiseAmount: foundSalary - adjustedBaseSalary,
        raisePercent: adjustedBaseSalary > 0 ? (foundSalary - adjustedBaseSalary) / adjustedBaseSalary : 0
    };
  }, [currentTitle, newTitle, currentStep, promoDate, currentSteps]);


  const formatMoney = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="container mt-4" style={{ maxWidth: '900px' }}>
      <div className="card shadow-lg border-0">
        <div className="card-header bg-success text-white text-center py-4">
          <h2 className="mb-0 fw-bold">Promotion Calculator</h2>
          <p className="mb-0 opacity-75">Estimate your new salary based on the 3% rule</p>
        </div>
        
        <div className="card-body p-4">
          
          {/* INPUTS */}
          <div className="row g-4">
            {/* Left: Current Status */}
            <div className="col-md-6 border-end">
              <h5 className="text-muted fw-bold mb-3">Current Position</h5>
              
              <div className="mb-3">
                <label className="form-label">Current Job Title</label>
                <Select 
                    options={titleOptions} 
                    onChange={setCurrentTitle}
                    placeholder="Search Title..."
                    className="basic-single"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Current Step</label>
                <select 
                    className="form-select" 
                    value={currentStep} 
                    onChange={e => setCurrentStep(e.target.value)}
                    disabled={!currentTitle}
                >
                    {currentSteps.map(s => (
                        <option key={s} value={s}>Step {s}</option>
                    ))}
                </select>
              </div>

              {currentTitle && salaryData[currentTitle.grade] && (
                  <div className="alert alert-secondary py-2">
                      <small>Base Salary: <strong>{formatMoney(salaryData[currentTitle.grade][currentStep])}</strong> (Bi-Weekly)</small>
                  </div>
              )}
            </div>

            {/* Right: New Position */}
            <div className="col-md-6">
              <h5 className="text-muted fw-bold mb-3">New Position</h5>
              
              <div className="mb-3">
                 <label className="form-label">Promotion Date</label>
                 <input 
                    type="date" 
                    className="form-control" 
                    value={promoDate} 
                    onChange={e => setPromoDate(e.target.value)} 
                 />
                 <small className="text-muted" style={{fontSize: '0.75rem'}}>
                    Checking against July 1st step increase
                 </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Promoted Job Title</label>
                <Select 
                    options={titleOptions} 
                    onChange={setNewTitle}
                    placeholder="Search New Title..."
                    className="basic-single"
                />
              </div>
            </div>
          </div>

          <hr className="my-4"/>

          {/* RESULTS */}
          {calculation ? (
            <div className="bg-light p-4 rounded border">
                <div className="row text-center mb-4">
                    <div className="col-md-4">
                        <small className="text-muted text-uppercase fw-bold">Starting Base</small>
                        <h4 className="text-secondary">{formatMoney(calculation.adjustedBase)}</h4>
                        {calculation.stepIncreaseApplied && (
                            <span className="badge bg-info text-dark">Includes Step Incr.</span>
                        )}
                    </div>
                    <div className="col-md-4">
                        <small className="text-muted text-uppercase fw-bold">Target Minimum (+3%)</small>
                        <h4 className="text-secondary opacity-75">{formatMoney(calculation.target)}</h4>
                    </div>
                    <div className="col-md-4">
                        <small className="text-muted text-uppercase fw-bold">New Salary</small>
                        <h2 className="text-success fw-bold">{formatMoney(calculation.newSalary)}</h2>
                    </div>
                </div>

                <div className="alert alert-success d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Congratulations!</strong> You will land on 
                        <span className="badge bg-white text-success fs-5 mx-2 border">Step {calculation.newStep}</span>
                        of Grade {newTitle?.grade}.
                    </div>
                    <div className="text-end">
                        <div className="small">Raise Amount</div>
                        <div className="fw-bold">{formatMoney(calculation.raiseAmount)} ({ (calculation.raisePercent * 100).toFixed(1) }%)</div>
                    </div>
                </div>
                
                <div className="row mt-3 text-center">
                    <div className="col-6">
                        <div className="card card-body py-2">
                             <small className="text-muted">New Annual Base</small>
                             <div className="fw-bold">{formatMoney(calculation.newSalary * PAY_PERIODS)}</div>
                        </div>
                    </div>
                    <div className="col-6">
                         <div className="card card-body py-2">
                             <small className="text-muted">Difference (Annual)</small>
                             <div className="fw-bold text-success">+{formatMoney(calculation.raiseAmount * PAY_PERIODS)}</div>
                        </div>
                    </div>
                </div>

            </div>
          ) : (
            <div className="text-center text-muted py-4">
                Fill in the details above to calculate your promotion.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}