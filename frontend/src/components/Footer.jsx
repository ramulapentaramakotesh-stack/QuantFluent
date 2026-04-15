import { motion } from 'framer-motion';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <motion.footer 
      className="footer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="footer-content">
        <div className="developer-info">
          <p className="developer-name">Developed by <strong>Ramakotesh Ramulapenta</strong></p>
          <div className="developer-links">
            <a 
              href="https://www.linkedin.com/in/ramakoteshramulapenta/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <span className="separator">|</span>
            <a href="mailto:ramakoteshramulapenta@gmail.com">
              ramakoteshramulapenta@gmail.com
            </a>
            <span className="separator">|</span>
            <a 
              href="https://github.com/ramulapentaramakotesh-stack" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
        <p className="copyright">&copy; {currentYear} QuantFluent. All rights reserved.</p>
      </div>
    </motion.footer>
  );
}

export default Footer;