import { motion } from 'framer-motion';
import './Card.css';

function Card({ children, className = '', delay = 0, onClick }) {
  return (
    <motion.div 
      className={`card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}
    >
      {children}
    </motion.div>
  );
}

export default Card;