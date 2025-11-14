import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { Icon } from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../services/supabaseClient';

interface WalkthroughStep {
  title: string;
  description: string;
  icon: string;
  target?: string;
}

const walkthroughSteps: WalkthroughStep[] = [
  {
    title: 'Welcome to Evolve! 🌱',
    description: 'Your AI-powered health companion. Let\'s take a quick tour to help you get started.',
    icon: 'heart',
  },
  {
    title: 'Dashboard 📊',
    description: 'Track your daily nutrition, view macro rings, and get personalized suggestions based on your goals.',
    icon: 'home',
  },
  {
    title: 'Journal 📝',
    description: 'Write daily reflections and get AI-powered insights about your emotional well-being and patterns.',
    icon: 'pencil',
  },
  {
    title: 'Meal Plans 🍽️',
    description: 'Generate personalized weekly meal plans with AI. Scan food labels to track nutrition automatically.',
    icon: 'utensils',
  },
  {
    title: 'Workouts 💪',
    description: 'Get custom 30-day workout plans tailored to your fitness level and goals. Track your progress daily.',
    icon: 'dumbbell',
  },
  {
    title: 'Profile 👤',
    description: 'View your progress charts, log weight, track menstrual cycle (for female users), and manage your account.',
    icon: 'user',
  },
  {
    title: 'Community 🌍',
    description: 'Join challenges, earn achievements, and see how the community is progressing together.',
    icon: 'users',
  },
  {
    title: 'Ready to Start! 🚀',
    description: 'You\'re all set! Start by logging your first meal or writing a journal entry. We\'re here to support your journey.',
    icon: 'check',
  },
];

export const Walkthrough: React.FC = () => {
  const { theme } = useTheme();
  const { user, updateUserProfile } = useUser();
  const isDark = theme === 'dark';
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkWalkthroughStatus = async () => {
      if (!user || hasChecked) {
        return;
      }

      try {
        // Check if user has seen walkthrough from their profile
        const hasSeenWalkthrough = user.has_seen_walkthrough ?? false;
        
        // Double-check with localStorage as fallback (for migration period)
        const localStorageCheck = localStorage.getItem(`evolve_walkthrough_seen_${user.id}`);
        
        setHasChecked(true);
        
        if (!hasSeenWalkthrough && !localStorageCheck) {
          // Show walkthrough after 1 second
          setTimeout(() => {
            setIsVisible(true);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking walkthrough status:', error);
        setHasChecked(true);
      }
    };

    checkWalkthroughStatus();
  }, [user, hasChecked]);

  const handleNext = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = async () => {
    setIsVisible(false);
    
    // Save to database and update local user state
    if (user) {
      try {
        // Save to localStorage immediately for instant feedback
        localStorage.setItem(`evolve_walkthrough_seen_${user.id}`, 'true');
        
        // Update database
        const { error } = await supabase
          .from('profiles')
          .update({ has_seen_walkthrough: true })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error updating walkthrough status:', error);
          // If DB update fails, localStorage will still prevent re-showing
        } else {
          // Update local user state to reflect the change
          await updateUserProfile({ ...user, has_seen_walkthrough: true });
        }
      } catch (error) {
        console.error('Error updating walkthrough status:', error);
      }
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isVisible) return null;

  const step = walkthroughSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === walkthroughSteps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div style={getStyles(isDark).backdrop} onClick={handleClose} />

      {/* Walkthrough Modal */}
      <div style={getStyles(isDark).container}>
        {/* Close Button */}
        <button onClick={handleClose} style={getStyles(isDark).closeButton}>
          <Icon name="times" size={20} color={isDark ? colors.light : colors.dark} />
        </button>

        {/* Content */}
        <div style={getStyles(isDark).content}>
          {/* Icon */}
          <div style={getStyles(isDark).iconContainer}>
            <Icon name={step.icon} size={48} color={colors.primary} />
          </div>

          {/* Title */}
          <h2 style={getStyles(isDark).title}>{step.title}</h2>

          {/* Description */}
          <p style={getStyles(isDark).description}>{step.description}</p>

          {/* Progress Dots */}
          <div style={getStyles(isDark).dotsContainer}>
            {walkthroughSteps.map((_, index) => (
              <div
                key={index}
                style={{
                  ...getStyles(isDark).dot,
                  ...(index === currentStep ? getStyles(isDark).dotActive : {}),
                }}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div style={getStyles(isDark).buttonsContainer}>
            {!isFirstStep && (
              <button onClick={handlePrevious} style={getStyles(isDark).buttonSecondary}>
                Previous
              </button>
            )}
            {isFirstStep && (
              <button onClick={handleSkip} style={getStyles(isDark).buttonSecondary}>
                Skip Tour
              </button>
            )}
            <button onClick={handleNext} style={getStyles(isDark).buttonPrimary}>
              {isLastStep ? 'Get Started!' : 'Next'}
            </button>
          </div>

          {/* Step Counter */}
          <p style={getStyles(isDark).stepCounter}>
            {currentStep + 1} of {walkthroughSteps.length}
          </p>
        </div>
      </div>
    </>
  );
};

const getStyles = (isDark: boolean): { [key: string]: React.CSSProperties } => ({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 9998,
    animation: 'fadeIn 0.3s ease',
  },
  container: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: isDark ? colors.gray[800] : colors.light,
    borderRadius: 16,
    padding: 32,
    maxWidth: 500,
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: isDark
      ? '0 20px 60px rgba(0, 0, 0, 0.5)'
      : '0 20px 60px rgba(0, 0, 0, 0.15)',
    zIndex: 9999,
    animation: 'slideUp 0.4s ease',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
    borderRadius: 8,
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    textAlign: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: isDark ? colors.light : colors.dark,
    margin: 0,
  },
  description: {
    fontSize: 16,
    lineHeight: 1.6,
    color: isDark ? colors.gray[300] : colors.gray[600],
    margin: 0,
  },
  dotsContainer: {
    display: 'flex',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: isDark ? colors.gray[600] : colors.slate[300],
    transition: 'all 0.3s',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  buttonsContainer: {
    display: 'flex',
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    color: colors.light,
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    color: isDark ? colors.light : colors.dark,
    border: `2px solid ${isDark ? colors.gray[600] : colors.slate[300]}`,
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  stepCounter: {
    fontSize: 14,
    color: isDark ? colors.gray[400] : colors.muted,
    margin: 0,
    marginTop: 8,
  },
});
