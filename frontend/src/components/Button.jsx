import { motion } from 'framer-motion';
import './Button.css';

function Button({ children, onClick, variant = 'primary', disabled = false, className = '' }) {
  return (
    <motion.button 
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.button>
  );
}

export default Button;