import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import './Landing.css';

function Landing({ onDemo, onGetStarted }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="logo">QuantFluent</span>
        <div className="nav-links">
          <Link to="#" onClick={onDemo}>Demo</Link>
          <button onClick={onGetStarted}>Get Started</button>
        </div>
      </nav>

      <section className="hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>QuantFluent</h1>
          <p className="hero-subtitle">Turn trading ideas into automated strategies</p>
          <div className="hero-buttons">
            <motion.button 
              className="btn-primary"
              onClick={onDemo}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Demo
            </motion.button>
            <motion.button 
              className="btn-secondary"
              onClick={onGetStarted}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>
        </motion.div>
      </section>

      <section className="features">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Features
        </motion.h2>
        <div className="features-grid">
          {[
            { title: 'AI Strategy Generation', desc: 'Describe your idea in plain English and let AI build your strategy' },
            { title: 'Backtesting Engine', desc: 'Test your strategy on real historical market data' },
            { title: 'Optimization Engine', desc: 'Find the best parameters for maximum performance' }
          ].map((f, i) => (
            <motion.div 
              key={i}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="indicators">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Supported Indicators
        </motion.h2>
        <div className="indicators-list">
          {['EMA', 'RSI', 'ATR', 'SMA', 'MACD', 'Bollinger Bands'].map((ind, i) => (
            <motion.span 
              key={i}
              className="indicator-tag"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              {ind}
            </motion.span>
          ))}
        </div>
      </section>

      <section className="how-it-works">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>
        <div className="steps">
          {[
            { step: '1', title: 'Describe', desc: 'Tell us your trading idea in plain English' },
            { step: '2', title: 'AI Builds', desc: 'Our AI generates a complete strategy' },
            { step: '3', title: 'Backtest', desc: 'Test on historical Binance data' },
            { step: '4', title: 'Optimize', desc: 'Find the best parameters automatically' }
          ].map((s, i) => (
            <motion.div 
              key={i}
              className="step"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <span className="step-num">{s.step}</span>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Landing;