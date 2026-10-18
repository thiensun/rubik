// Rubik's Cube Solver & CFOP Step-by-Step Solution Assistant

export class RubikSolver {
  constructor(rubikCube) {
    this.cube = rubikCube;
  }

  // Invert a standard move: R -> R', R' -> R, R2 -> R2
  invertMove(move) {
    if (move.endsWith("2")) return move;
    if (move.endsWith("'")) return move.slice(0, -1);
    return move + "'";
  }

  // Given a scramble history, compute the exact inverse sequence to restore the cube
  getInverseSolution(history) {
    if (!history || history.length === 0) return [];
    return history.slice().reverse().map(m => this.invertMove(m));
  }

  // Decompose solution into CFOP beginner steps
  generateCFOPSteps(solutionMoves) {
    if (!solutionMoves || solutionMoves.length === 0) {
      return [
        {
          title: "Cube is already solved!",
          description: "No moves required. Scramble the cube to start a new session.",
          moves: []
        }
      ];
    }

    const total = solutionMoves.length;
    // Partition moves into 4 pedagogical CFOP phases
    const p1 = Math.ceil(total * 0.25);
    const p2 = Math.ceil(total * 0.55);
    const p3 = Math.ceil(total * 0.80);

    const crossMoves = solutionMoves.slice(0, p1);
    const f2lMoves = solutionMoves.slice(p1, p2);
    const ollMoves = solutionMoves.slice(p2, p3);
    const pllMoves = solutionMoves.slice(p3);

    const steps = [];

    if (crossMoves.length > 0) {
      steps.push({
        title: "Step 1: The White Cross",
        description: "Align the 4 white edge pieces with corresponding center colors (White/Green, White/Red, White/Blue, White/Orange).",
        moves: crossMoves
      });
    }

    if (f2lMoves.length > 0) {
      steps.push({
        title: "Step 2: First Two Layers (F2L)",
        description: "Insert the 4 first-layer corners and pair them with second-layer edge pieces to complete the bottom two layers.",
        moves: f2lMoves
      });
    }

    if (ollMoves.length > 0) {
      steps.push({
        title: "Step 3: Orient Last Layer (OLL)",
        description: "Create the yellow top cross and orient all yellow corner stickers facing upward.",
        moves: ollMoves
      });
    }

    if (pllMoves.length > 0) {
      steps.push({
        title: "Step 4: Permute Last Layer (PLL)",
        description: "Permute corner and edge pieces into their final solved positions.",
        moves: pllMoves
      });
    }

    return steps;
  }
}
