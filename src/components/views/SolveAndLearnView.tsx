import React, { useState, useEffect } from 'react';
import { StepWizardHeader } from '../solver/StepWizardHeader';
import { Step1SelectLevel } from '../solver/Step1SelectLevel';
import { Step2CameraScan } from '../solver/Step2CameraScan';
import { Step3SolveInteractive, CustomAlgorithmData } from '../solver/Step3SolveInteractive';
import { SolveRecord, SolverLevelId } from '../../types/cubing';
import { CubeNetState, applyScramble } from '../../utils/cubeState';

interface SolveAndLearnViewProps {
  analyzedSolve?: SolveRecord | null;
  onClearAnalyzedSolve?: () => void;
  onBackToTimer: () => void;
  initialStep?: 1 | 2 | 3;
  customAlgorithm?: CustomAlgorithmData | null;
  onClearCustomAlgorithm?: () => void;
}

export const SolveAndLearnView: React.FC<SolveAndLearnViewProps> = ({
  analyzedSolve,
  onClearAnalyzedSolve,
  onBackToTimer,
  initialStep = 1,
  customAlgorithm,
  onClearCustomAlgorithm,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialStep);
  const [selectedLevel, setSelectedLevel] = useState<SolverLevelId>('level-2');
  const [scannedCubeState, setScannedCubeState] = useState<CubeNetState | null>(() => {
    try {
      const saved = localStorage.getItem('cubemaster_scanned_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [demoScramble, setDemoScramble] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cubemaster_demo_scramble');
    } catch (e) {
      return null;
    }
  });

  const handleSetDemoScramble = (scramble: string | null) => {
    setDemoScramble(scramble);
    try {
      if (scramble) {
        localStorage.setItem('cubemaster_demo_scramble', scramble);
      } else {
        localStorage.removeItem('cubemaster_demo_scramble');
      }
    } catch (e) {}
  };

  const handleUpdateScannedCube = (newState: CubeNetState | null) => {
    setScannedCubeState(newState);
    try {
      if (newState) {
        localStorage.setItem('cubemaster_scanned_state', JSON.stringify(newState));
      } else {
        localStorage.removeItem('cubemaster_scanned_state');
      }
    } catch (e) {}
  };

  // When a solve is selected for analysis from Session History, load its scramble & 3D state!
  useEffect(() => {
    if (analyzedSolve && analyzedSolve.scramble) {
      const scrambledCube = applyScramble(analyzedSolve.scramble);
      handleUpdateScannedCube(scrambledCube);
      handleSetDemoScramble(analyzedSolve.scramble);
      setCurrentStep(3);
    }
  }, [analyzedSolve]);

  // Sync currentStep when initialStep or customAlgorithm prop changes
  useEffect(() => {
    if (customAlgorithm) {
      setCurrentStep(3);
    } else if (initialStep) {
      setCurrentStep(initialStep);
    }
  }, [initialStep, customAlgorithm]);

  // Keyboard navigation: 1, 2, 3 to switch between steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '1') {
        setCurrentStep(1);
      } else if (e.key === '2') {
        setCurrentStep(2);
      } else if (e.key === '3') {
        setCurrentStep(3);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* 3-Step Wizard Navigation Header */}
      <StepWizardHeader
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        currentFaceNumber={3}
      />

      {/* Step 1: Select Level & Method */}
      {currentStep === 1 && (
        <Step1SelectLevel
          selectedLevel={selectedLevel}
          onSelectLevel={setSelectedLevel}
          onProceedToScan={() => setCurrentStep(2)}
        />
      )}

      {/* Step 2: 6-Face Camera Scan */}
      {currentStep === 2 && (
        <Step2CameraScan
          selectedLevel={selectedLevel}
          onBackToStep1={() => setCurrentStep(1)}
          onProceedToStep3={() => setCurrentStep(3)}
          onUpdateScannedCube={handleUpdateScannedCube}
          demoScramble={demoScramble}
          onSetDemoScramble={handleSetDemoScramble}
        />
      )}

      {/* Step 3: Interactive 3D Solution */}
      {currentStep === 3 && (
        <Step3SolveInteractive
          selectedLevel={selectedLevel}
          onBackToScan={() => setCurrentStep(2)}
          onSwitchLevel={() => setCurrentStep(1)}
          customAlgorithm={customAlgorithm}
          onClearCustomAlgorithm={onClearCustomAlgorithm}
          scannedCubeState={scannedCubeState}
          onUpdateScannedCube={handleUpdateScannedCube}
          demoScramble={demoScramble}
          onSetDemoScramble={handleSetDemoScramble}
          analyzedSolve={analyzedSolve}
          onClearAnalyzedSolve={onClearAnalyzedSolve}
        />
      )}
    </div>
  );
};
