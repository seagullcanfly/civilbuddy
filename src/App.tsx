import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import SalaryVerification from './pages/SalaryVerification';
import PromotionCalculator from './pages/PromotionCalculator';
import 'bootstrap/dist/css/bootstrap.min.css';

// Simple Nav Component to highlight active link
function NavBar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active fw-bold' : '';

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">Civil Buddy</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/')}`} to="/">Salary Verification</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/promotion')}`} to="/promotion">Promotion Calculator</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-vh-100 bg-light pb-5">
        <NavBar />
        <Routes>
          <Route path="/" element={<SalaryVerification />} />
          <Route path="/promotion" element={<PromotionCalculator />} />
        </Routes>
        
        <footer className="text-center text-muted mt-5 py-3">
          <div className="container border-top pt-3">
            <small>
              Civil Buddy &copy; 2026. Data verified against Suffolk County salary schedules.
              <br/>For informational purposes only.
            </small>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;