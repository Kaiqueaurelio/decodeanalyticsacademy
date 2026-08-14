# Plan: Integrated Audio Lesson + Automatic Quiz System

Implement a high-fidelity e-learning feature where a professional audio player triggers an interactive quiz upon completion.

## User Review Required

> [!IMPORTANT]
> The quiz data (questions, types, points) will be stored in a new Supabase table. Should we also add an interface in the Admin area for you to create these quizzes manually, or will they be strictly hardcoded/imported via JSON for now?

- **Branding**: The system will follow the "High-Tech" aesthetic (Ciano #00f0ff, Roxo #a855f7).
- **Audio Detection**: The quiz triggers automatically when the audio ends.
- **Question Types**: Multiple choice, True/False, Open text, Ordering (Drag & Drop), Matching.

## Proposed Changes

### Database (Supabase)

#### [NEW] `quizzes` and `quiz_questions`
- Create tables to store quiz metadata and individual questions.
- Support `type`: `multiple-choice`, `true-false`, `open`, `ordering`, `matching`.
- Add RLS policies for students to read and submit, and admins to manage.

#### [NEW] `quiz_submissions`
- Store user results, scores, and individual answers for performance tracking.

### Components

#### [NEW] `src/components/AudioQuizSystem.tsx`
- Orchestrator component.
- Handles the state transition between `ProfessionalAudioPlayer` and `QuizContainer`.

#### [NEW] `src/components/QuizContainer.tsx`
- Renders questions based on type.
- Tracks current progress (X of Y).
- Validates mandatory fields before submission.

#### [NEW] `src/components/quiz/QuestionRenderer.tsx` (and subtypes)
- Separate components for each question type to maintain code clarity.

### Logic & Hooks

#### `src/components/ProfessionalAudioPlayer.tsx`
- Add `onEnded` callback prop to detect completion.
- Add "Finish Lesson" manual button for quick completion by admins/students.

## Technical Details
- **State Management**: React state for transient quiz progress, `localStorage` for recovery.
- **Animations**: `framer-motion` for the fade-out/fade-in transitions between audio and quiz.
- **Persistence**: Real-time saving to `quiz_submissions` table via TanStack Query.
- **Ordering/Matching**: Use `@dnd-kit` for drag-and-drop interactions.

## Verification Plan
1. **Automated Tests**: Script to simulate audio completion and verify quiz visibility.
2. **Manual Check**: Verify "Juliana" user (restricted) can access non-ENEM quizzes.
3. **Mobile Audit**: Ensure Drag & Drop works on touch devices.
