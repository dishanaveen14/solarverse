'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, RotateCcw, HelpCircle, Trophy } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';

export default function QuizSection() {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const filteredQuestions = selectedDifficulty === 'all'
    ? QUIZ_QUESTIONS
    : QUIZ_QUESTIONS.filter(q => q.difficulty === selectedDifficulty);

  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('solarverse_quiz_best');
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  const handleSelectOption = (idx) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    setIsAnswered(true);

    if (idx === currentQ.answer) {
      const newScore = score + 1;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        if (typeof window !== 'undefined') {
          localStorage.setItem('solarverse_quiz_best', newScore.toString());
        }
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < filteredQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = (diff = selectedDifficulty) => {
    setSelectedDifficulty(diff);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsFinished(false);
    setScore(0);
  };

  return (
    <section id="quiz-section" style={{
      maxWidth: '840px',
      margin: '0 auto 120px',
      padding: '0 1.5rem'
    }}>
      <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div className="badge" style={{ marginBottom: '0.5rem' }}>
              <HelpCircle size={12} />
              <span>Solar Knowledge Check</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>
              Astronomical Quiz
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Trophy size={16} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', color: '#fcd34d', fontWeight: 600 }}>
              Best: {highScore}
            </span>
          </div>
        </div>

        {/* Difficulty Tabs */}
        {!isFinished && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            {['all', 'easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => handleRestart(diff)}
                style={{
                  background: selectedDifficulty === diff ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  border: selectedDifficulty === diff ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: selectedDifficulty === diff ? '#38bdf8' : '#94a3b8',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer'
                }}
              >
                {diff}
              </button>
            ))}
          </div>
        )}

        {/* Finished State */}
        {isFinished ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Award size={48} color="#38bdf8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
              Quiz Completed!
            </h3>
            <p style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              You scored <strong style={{ color: '#38bdf8' }}>{score}</strong> out of <strong>{filteredQuestions.length}</strong>
            </p>
            <button
              onClick={() => handleRestart(selectedDifficulty)}
              className="btn-primary"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              <RotateCcw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        ) : (
          /* Active Question State */
          <div>
            {/* Progress counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
              <span>Question {currentIndex + 1} of {filteredQuestions.length}</span>
              <span style={{ textTransform: 'capitalize' }}>Difficulty: {currentQ?.difficulty}</span>
            </div>

            {/* Question Text */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {currentQ?.question}
            </h3>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {currentQ?.options.map((opt, idx) => {
                let borderCol = 'rgba(255, 255, 255, 0.08)';
                let bgCol = 'rgba(15, 23, 42, 0.6)';
                let textCol = '#e2e8f0';

                if (isAnswered) {
                  if (idx === currentQ.answer) {
                    borderCol = '#10b981';
                    bgCol = 'rgba(16, 185, 129, 0.15)';
                    textCol = '#10b981';
                  } else if (idx === selectedAnswer) {
                    borderCol = '#ef4444';
                    bgCol = 'rgba(239, 68, 68, 0.15)';
                    textCol = '#f87171';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.875rem 1.25rem',
                      borderRadius: '10px',
                      backgroundColor: bgCol,
                      border: `1px solid ${borderCol}`,
                      color: textCol,
                      fontSize: '0.925rem',
                      textAlign: 'left',
                      cursor: isAnswered ? 'default' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === currentQ.answer && <CheckCircle size={18} color="#10b981" />}
                    {isAnswered && idx === selectedAnswer && idx !== currentQ.answer && <XCircle size={18} color="#ef4444" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation box after answer */}
            {isAnswered && (
              <div style={{
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.25rem' }}>Explanation:</strong>
                {currentQ.explanation}
              </div>
            )}

            {/* Next Button */}
            {isAnswered && (
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={handleNext}
                  className="btn-primary"
                  style={{ padding: '0.625rem 1.5rem', fontSize: '0.875rem' }}
                >
                  <span>{currentIndex + 1 < filteredQuestions.length ? 'Next Question →' : 'See Results'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
