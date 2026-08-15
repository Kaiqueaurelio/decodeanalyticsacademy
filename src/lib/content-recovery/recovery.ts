import { supabase } from "@/integrations/supabase/client";
import { subjectKey } from "@/lib/curriculum-subjects";

interface WorkbookMetadata {
  id: string;
  title: string;
  subject: string;
  description: string;
}

interface ContentBlock {
  title: string;
  order: number;
  content: string;
}

/**
 * PRIORITY 1: Restore Theoretical Aspects of Computing Content
 */
export async function restoreTheoreticalComputingApostila() {
  const theoreticalContent = {
    id: 'apostila_theoretical_computing_001',
    title: 'Theoretical Aspects of Computing',
    subject: 'Computer Science',
    description: 'Complete guide to theoretical computation, algorithms, and computational complexity',
    
    sections: [
      {
        title: 'Chapter 1: Fundamentals of Computation',
        order: 1,
        content: `
## 1.1 What is Computation?

Computation is the process of transforming input data into output data following a set of rules or algorithms. 
It encompasses all mathematical and logical operations performed by computational systems.

### Key Concepts:
- **Algorithm**: A finite sequence of well-defined instructions to solve a problem
- **Turing Machine**: Abstract computing machine used to model computability
- **Complexity**: Measurement of algorithm efficiency (time and space)

## 1.2 Historical Context

The theory of computation emerged from:
- David Hilbert's Decision Problem (1928)
- Alan Turing's Turing Machine (1936)
- Church-Turing Thesis (1936)
- Modern complexity theory (1960s-present)

## 1.3 Core Principles

**Church-Turing Thesis**: Any effectively computable function can be computed by a Turing machine.

This fundamental principle establishes that different models of computation (lambda calculus, recursive functions, 
Turing machines) are equivalent in computational power.

### Implications:
1. No practical computing model is more powerful than a Turing machine
2. Algorithmic computability is well-defined and universal
3. Some problems are fundamentally uncomputable
        `
      },
      {
        title: 'Chapter 2: Formal Languages & Automata',
        order: 2,
        content: `
## 2.1 Formal Languages

A formal language is a precise, mathematical description of languages using:
- **Alphabet (Σ)**: Finite set of symbols
- **String**: Sequence of symbols from the alphabet
- **Language**: Set of strings over an alphabet

### Examples:
- Binary language: Σ = {0, 1}
- Programming language: Σ = {keywords, operators, identifiers}
- DNA sequences: Σ = {A, T, G, C}

## 2.2 Automata Theory

### Finite Automata (FA)
- **Definition**: Machine with finite number of states
- **Types**: Deterministic (DFA) and Nondeterministic (NFA)
- **Capability**: Recognize regular languages
- **Limitation**: Cannot count or maintain memory

### Example: DFA for binary strings ending in '01'
\`\`\`
States: q0 (start), q1 (saw 0), q2 (saw 01)
Transitions:
  q0 --0--> q1
  q0 --1--> q0
  q1 --0--> q1
  q1 --1--> q2
  q2 --0--> q1
  q2 --1--> q0
\`\`\`

### Pushdown Automata (PDA)
- Stack-based memory device
- Recognizes context-free languages
- Can count and match balanced parentheses

### Turing Machine (TM)
- Infinite tape with read/write head
- Theoretical model of computation
- Can solve any computable problem
- Halting problem is undecidable

## 2.3 Chomsky Hierarchy

| Language Class | Automaton | Grammar | Capability |
|---|---|---|---|
| Regular | DFA/NFA | Right-linear | Simple patterns |
| Context-Free | PDA | CFG | Balanced structures |
| Context-Sensitive | LBA | CSG | Limited recursion |
| Recursively Enumerable | Turing Machine | Unrestricted | Any computation |

        `
      },
      {
        title: 'Chapter 3: Computational Complexity',
        order: 3,
        content: `
## 3.1 Time Complexity

Time complexity measures algorithm efficiency as function of input size (n).

### Big-O Notation
- **O(1)**: Constant time (array access, hash lookup)
- **O(log n)**: Logarithmic (binary search)
- **O(n)**: Linear (simple search)
- **O(n log n)**: Linearithmic (merge sort, quick sort)
- **O(n²)**: Quadratic (bubble sort, selection sort)
- **O(n³)**: Cubic (matrix multiplication naive)
- **O(2^n)**: Exponential (subset generation)
- **O(n!)**: Factorial (permutation generation)

### Examples:

**Linear Search - O(n)**
\`\`\`
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}
\`\`\`

**Binary Search - O(log n)**
\`\`\`
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
\`\`\`

## 3.2 Space Complexity

Measures memory usage as function of input size.

### Common Space Complexities:
- **O(1)**: Constant space (no extra memory)
- **O(n)**: Linear space (storing input)
- **O(n²)**: Quadratic space (2D arrays)
- **O(log n)**: Logarithmic space (recursion depth)

## 3.3 P vs NP Problem

### P (Polynomial Time)
Problems solvable in polynomial time by deterministic Turing machine.

Examples:
- Sorting: O(n log n)
- Graph connectivity: O(n + m)
- Shortest path: O(n log n)

### NP (Nondeterministic Polynomial)
Problems verifiable in polynomial time.

Examples:
- SAT (Boolean satisfiability)
- Traveling Salesman Problem (TSP)
- Knapsack Problem

### The Million-Dollar Question
**Does P = NP?**

If P = NP:
- Every verifiable problem is solvable in polynomial time
- Most modern cryptography would be broken
- Extremely unlikely but unproven

### NP-Complete Problems
- Subset of NP problems
- As hard as any NP problem
- If one is solvable in polynomial time, all are
- Examples: SAT, 3-SAT, Clique, Vertex Cover

## 3.4 Reduction & Completeness

**Polynomial Reduction**: Converting one problem to another in polynomial time

**NP-Complete**: Problem is both in NP and NP-hard

Cook-Levin Theorem: SAT is NP-complete (first proven NP-complete problem)

        `
      },
      {
        title: 'Chapter 4: Decidability & Undecidability',
        order: 4,
        content: `
## 4.1 Decidability

A language/problem is **decidable** if there exists a Turing machine that:
1. Accepts the input if answer is YES
2. Rejects the input if answer is NO
3. Always halts (never loops)

### Decidable Problems:
- Membership testing (is string in language?)
- Regular language properties
- Context-free language properties
- Graph properties (connectivity, cycles)

## 4.2 Undecidability

A language/problem is **undecidable** if no Turing machine can solve it with guarantee of halting.

### The Halting Problem (Most Famous)

**Problem**: Given a program P and input I, does P halt on I?

**Proof by Contradiction**:
Assume halting problem is decidable.

\`\`\`
function halts(program, input) {
  // Hypothetically determines if program halts on input
  return true_or_false;
}

// Create contradictory program
function diagonal(program) {
  if (halts(program, program)) {
    while (true) {} // Loop forever
  } else {
    return; // Halt
  }
}

// What happens when we call diagonal(diagonal)?
// If halts(diagonal, diagonal) = true:
//   diagonal calls loop forever (contradiction!)
// If halts(diagonal, diagonal) = false:
//   diagonal halts immediately (contradiction!)
// Therefore, halts() cannot exist.
\`\`\`

### Other Undecidable Problems:
- **Rice's Theorem**: Any non-trivial property of recursive languages is undecidable
- **Post Correspondence Problem**: No algorithm determines if two string lists have a solution
- **Ambiguity in Context-Free Grammars**: Can't determine if grammar is ambiguous
- **Equivalence of Context-Free Grammars**: Can't determine if two CFGs accept same language

## 4.3 Semidecidability

A language is **semidecidable** (recognizable) if a Turing machine can:
- Accept if answer is YES
- Never halt if answer is NO

All decidable languages are semidecidable, but not vice versa.

        `
      },
      {
        title: 'Chapter 5: Advanced Topics',
        order: 5,
        content: `
## 5.1 Quantum Computing

Quantum computers use quantum bits (qubits) with properties:
- **Superposition**: Qubit can be 0, 1, or both simultaneously
- **Entanglement**: Multiple qubits share correlated states
- **Interference**: Amplify correct answers, cancel wrong ones

### Quantum Advantage:
- **Shor's Algorithm**: Factor large numbers exponentially faster (threatens RSA)
- **Grover's Algorithm**: Search unsorted database with quadratic speedup
- **Quantum Simulation**: Simulate quantum systems efficiently

### Limitations:
- Quantum decoherence (qubits lose state)
- Limited number of useful qubits
- Error rates still high
- Not faster for all problems

## 5.2 Approximation Algorithms

For NP-hard problems, approximation algorithms find near-optimal solutions quickly.

### Approximation Ratio:
For maximization: ALG(I) ≥ OPT(I) / c
For minimization: ALG(I) ≤ OPT(I) × c

Where c is approximation factor (c > 1).

### Examples:
- **Traveling Salesman**: 1.5-approximation using MST
- **Vertex Cover**: 2-approximation (greedy matching)
- **Set Cover**: ln(n)-approximation (greedy)

## 5.3 Randomized Algorithms

Algorithms using randomness for efficiency.

### Types:
- **Las Vegas**: Always correct, random runtime
- **Monte Carlo**: Random correctness, deterministic runtime

### Example: Quicksort with random pivot
Average: O(n log n)
Worst case: O(n²) (rare with random pivoting)

## 5.4 Parallel & Distributed Computation

- **Parallel Algorithms**: Multiple processors on shared memory
- **Distributed Algorithms**: Multiple machines with message passing
- **Complexity Classes**: NC (highly parallelizable), P-complete (likely not parallelizable)

        `
      },
      {
        title: 'Chapter 6: Modern Applications',
        order: 6,
        content: `
## 6.1 Machine Learning & Computation

Machine learning relies on computational theory:
- **Training**: Optimization using gradient descent (polynomial time approximation)
- **Prediction**: Function evaluation (usually polynomial)
- **Complexity**: Training time grows with data size and model complexity

### Theoretical Limits:
- No-free-lunch theorem: No algorithm universally best for all problems
- Sample complexity: Amount of data needed for learning
- Generalization bounds: How well model performs on unseen data

## 6.2 Cryptography

**Public Key Cryptography** relies on computational hardness:
- **RSA**: Factoring product of large primes is computationally hard
- **ECC**: Discrete logarithm problem on elliptic curves
- **Post-Quantum**: Preparing for quantum computer threat

Security = Theoretical hardness + Practical implementation

## 6.3 Formal Verification

Using computation theory to prove software correctness:
- **Model Checking**: Exhaustively verify finite systems
- **Theorem Proving**: Use logic to verify properties
- **Type Systems**: Prevent classes of errors at compile time

Applications: Critical systems (aircraft, medical, nuclear)

## 6.4 Computability in Practice

Limitations and workarounds:
- Undecidable problems: Use heuristics, approximations, or restricted inputs
- Intractable (NP-hard) problems: Approximation algorithms, randomization, parallel processing
- Practical trade-offs: Time vs space, correctness vs speed

        `
      }
    ]
  };

  try {
    // 1. DELETE OLD INCOMPLETE DATA (if exists)
    // We use the ID apostila_theoretical_computing_001
    await supabase
      .from('apostilas')
      .delete()
      .eq('id', theoreticalContent.id);

    // 2. CREATE APOSTILA WITH FULL METADATA
    const { data: apostila, error: apostilaError } = await supabase
      .from('apostilas')
      .insert({
        id: theoreticalContent.id,
        title: theoreticalContent.title,
        category: theoreticalContent.subject, 
        subject: theoreticalContent.subject, // Restored column
        cover_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000',
        published: true,
        semester: 5,
        created_by: 'admin',
        content: theoreticalContent.description
      })
      .select()
      .single();

    if (apostilaError) throw apostilaError;

    // 3. INSERT CHAPTERS (in apostila_pages table which seems to be the content store)
    const pages = theoreticalContent.sections.map((section, idx) => ({
      apostila_id: apostila.id,
      title: section.title,
      content: section.content,
      position: section.order
    }));

    const { error: pagesError } = await supabase
      .from('apostila_pages')
      .insert(pages);

    if (pagesError) throw pagesError;

    // 4. CREATE ASSOCIATED EXERCISES
    const exercises = [
      {
        question: 'Explain the Church-Turing Thesis and its implications for computing.',
        correct_answer: 'The Church-Turing Thesis states that any effectively computable function can be computed by a Turing machine.',
        type: 'essay'
      },
      {
        question: 'Design a DFA for binary strings ending in "01". Describe the states and transitions.',
        correct_answer: 'States: q0 (start), q1 (saw 0), q2 (saw 01). Transitions: q0-0->q1, q0-1->q0, q1-0->q1, q1-1->q2, q2-0->q1, q2-1->q0.',
        type: 'essay'
      },
      {
        question: 'Analyze and prove that merge sort has O(n log n) time complexity.',
        correct_answer: 'Merge sort uses divide and conquer, splitting the array into halves (log n depth) and merging them in linear time (O(n)).',
        type: 'essay'
      },
      {
        question: 'Provide the proof by contradiction for the Halting Problem.',
        correct_answer: 'Assume a halts(P, I) function exists, create a diagonal(P) that loops if P halts and halts if P loops, then diagonal(diagonal) creates a contradiction.',
        type: 'essay'
      }
    ];

    const exercisesToInsert = exercises.map((ex, idx) => ({
      apostila_id: apostila.id,
      question: ex.question,
      correct_answer: ex.correct_answer,
      type: ex.type,
      sort_order: idx
    }));

    const { error: exercisesError } = await supabase
      .from('exercises')
      .insert(exercisesToInsert);

    if (exercisesError) throw exercisesError;

    console.log('✅ Theoretical Aspects of Computing apostila FULLY RESTORED');
    return { success: true, apostila, pageCount: pages.length };
  } catch (error) {
    console.error('❌ Error restoring Theoretical Computing:', error);
    throw error;
  }
}

/**
 * VERIFY & RESTORE ALL APOSTILAS
 */
export async function verifyAllApostilasIntegrity() {
  console.log('🔍 Starting comprehensive apostila integrity check...');

  const { data: apostilas, error } = await supabase
    .from('apostilas')
    .select('id, title, subject, category');

  if (error) throw error;

  const integrityReport: any[] = [];

  for (const apostila of apostilas || []) {
    const issues = [];
    
    // Check subject field
    if (!apostila.subject) {
      issues.push('Missing subject field');
    }

    // Check pages
    const { count: pageCount } = await supabase
      .from('apostila_pages')
      .select('id', { count: 'exact', head: true })
      .eq('apostila_id', apostila.id);

    if (!pageCount || pageCount === 0) {
      issues.push('No content pages found');
    }

    // Check exercises
    const { count: exerciseCount } = await supabase
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('apostila_id', apostila.id);

    if (!exerciseCount || exerciseCount === 0) {
      issues.push('No exercises found');
    }

    integrityReport.push({
      id: apostila.id,
      title: apostila.title,
      status: issues.length === 0 ? '✅ INTACT' : '⚠️ ISSUES',
      issues,
      pageCount,
      exerciseCount,
      needsRepair: issues.length > 0
    });
  }

  return integrityReport;
}

/**
 * REPAIR ALL CORRUPTED APOSTILAS
 */
export async function repairAllCorruptedApostilas() {
  console.log('🔧 Starting comprehensive repair...');

  const { data: apostilas } = await supabase
    .from('apostilas')
    .select('*');

  for (const apostila of apostilas || []) {
    let updates: any = {};
    let needsUpdate = false;

    if (!apostila.subject) {
      updates.subject = inferSubjectFromTitle(apostila.title);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await supabase
        .from('apostilas')
        .update(updates)
        .eq('id', apostila.id);
      
      console.log(`✅ Repaired metadata for: ${apostila.title}`);
    }
  }

  console.log('✅ All apostilas have been repaired!');
}

function inferSubjectFromTitle(title: string): string {
  const subjectMap: Record<string, string> = {
    'programming': 'Programming',
    'algorithm': 'Computer Science',
    'data structure': 'Computer Science',
    'database': 'Database Design',
    'web': 'Web Development',
    'theoretical': 'Computer Science',
    'computation': 'Computer Science',
    'security': 'Cybersecurity',
    'network': 'Networking'
  };

  for (const [keyword, subject] of Object.entries(subjectMap)) {
    if (title.toLowerCase().includes(keyword)) {
      return subject;
    }
  }

  return 'General';
}

function generateHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
