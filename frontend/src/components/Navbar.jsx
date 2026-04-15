import { motion } from 'framer-motion';
import './Navbar.css';

function Navbar({ user, onNavigate, currentPage, onLogout }) {
  return (
    <motion.nav 
      className="navbar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="navbar-brand">
        <span className="logo">QuantFluent</span>
      </div>
      
      <div className="navbar-links">
        <button 
          className={`nav-link ${currentPage === 'chat' ? 'active' : ''}`}
          onClick={() => onNavigate('chat')}
        >
          Chat
        </button>
        <button 
          className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          Dashboard
        </button>
      </div>
      
      <div className="navbar-user">
        <span className="user-email">{user?.email}</span>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </motion.nav>
  );
}

export default Navbar;