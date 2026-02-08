
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, Move, Player } from "../types";

const apiKey = process.env.API_KEY || 'MISSING_KEY';
let ai: GoogleGenAI | null = null;

try {
  ai = new GoogleGenAI({ apiKey });
} catch (error) {
  console.warn("AI Service initialization failed (likely invalid key):", error);
}

export async function getBestMove(state: GameState): Promise<Move | null> {
  if (!ai) return null;

  const player = state.turn;
  const boardRepresentation = state.board.map(row =>
    row.map(p => p ? `${p.player.charAt(0)}${p.type === 'KING' ? 'K' : 'N'}` : 'EE')
  );

  const difficultyPrompt = [
    "Easy: Makes random or obvious moves.",
    "Medium: Understands basic positioning and trades.",
    "Hard: Plays strategically, controls center, thinks several moves ahead.",
    "Master: Expert level, uses advanced tactics.",
    "Impossible: Near perfect play."
  ][state.difficulty - 1];

  const systemInstruction = `
    You are a professional Checkers (Dama) AI.
    Difficulty Level: ${state.difficulty}/5 (${difficultyPrompt}).
    The current board is an 8x8 grid. 
    Pieces: WN (White Normal), WK (White King), BN (Black Normal), BK (Black King), EE (Empty).
    Your player: ${player}.
    Analyze the board and choose the best valid move.
    Rules: Mandatory jump if available.
    Return ONLY the move in JSON format: {"from": {"row": r, "col": c}, "to": {"row": r2, "col": c2}}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Board state:\n${JSON.stringify(boardRepresentation)}\n\nWhat is the best move for ${player}?`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            from: {
              type: Type.OBJECT,
              properties: {
                row: { type: Type.INTEGER },
                col: { type: Type.INTEGER }
              },
              required: ["row", "col"]
            },
            to: {
              type: Type.OBJECT,
              properties: {
                row: { type: Type.INTEGER },
                col: { type: Type.INTEGER }
              },
              required: ["row", "col"]
            }
          },
          required: ["from", "to"]
        }
      }
    });

    const moveData = JSON.parse(response.text);
    return moveData as Move;
  } catch (error) {
    console.error("AI Move Generation Error:", error);
    return null;
  }
}
