import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import SalaryVerification from './pages/SalaryVerification';
import PromotionCalculator from './pages/PromotionCalculator';
import CareerMap from './pages/CareerMap';
import SpecSearch from './pages/SpecSearch';
import 'bootstrap/dist/css/bootstrap.min.css';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5 text-center">
          <div className="alert alert-danger">
            <h2 className="alert-heading">Something went wrong.</h2>
            <p>The application crashed. Here is the error:</p>
            <pre className="bg-light p-3 border text-start overflow-auto">
              {this.state.error?.toString()}
            </pre>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload Page</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Nav Component
function NavBar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active fw-bold' : '';

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark mb-4 sticky-top">
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
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/career-map')}`} to="/career-map">Career Map</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/search')}`} to="/search">Search Specs</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-vh-100 bg-light pb-5">
          <NavBar />
          <Routes>
            <Route path="/" element={<SalaryVerification />} />
            <Route path="/promotion" element={<PromotionCalculator />} />
            <Route path="/career-map" element={<CareerMap />} />
            <Route path="/search" element={<SpecSearch />} />
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
    </ErrorBoundary>
  );
}

export default App;
