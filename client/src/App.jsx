import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import History from './pages/History';

export default function App() {
  return <>
    <nav className="nav">
      <Link to="/" className="brand">🛡️ ScamShield AI</Link>
      <div><Link to="/scanner">Scanner</Link><Link to="/history">History</Link></div>
    </nav>
    <main><Routes><Route path="/" element={<Home/>}/><Route path="/scanner" element={<Scanner/>}/><Route path="/history" element={<History/>}/></Routes></main>
  </>;
}
