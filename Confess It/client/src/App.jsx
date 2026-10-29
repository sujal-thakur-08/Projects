import { useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [finalContent, setFinalContent] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [noTaps, setNoTaps] = useState(0);
  const [noPos, setNoPos] = useState({ left: 62, top: 8 });
  const [yesTapAttempts, setYesTapAttempts] = useState(0);
  const [yesSpinning, setYesSpinning] = useState(false);
  const [yesSpinVariant, setYesSpinVariant] = useState(0);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      const [qRes, fRes] = await Promise.all([
        fetch(`${API_BASE}/api/questions`),
        fetch(`${API_BASE}/api/final-content`),
      ]);

      const qData = await qRes.json();
      const fData = await fRes.json();

      setQuestions(qData.questions || []);
      setFinalContent(fData || null);
    }

    loadData().catch(() => {
      setQuestions([]);
      setFinalContent(null);
    });
  }, []);

  const isLoading = !questions.length || !finalContent;
  const inQuiz = !isLoading && currentQuestion < questions.length;
  const inFinal = !isLoading && currentQuestion >= questions.length && !resultMessage;

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    return ((Math.min(currentQuestion + 1, questions.length)) / questions.length) * 100;
  }, [currentQuestion, questions.length]);

  function onOptionClick(index) {
    if (selected !== null) return;
    setSelected(index);
    setScore((s) => s + 1);

    setTimeout(() => {
      setCurrentQuestion((q) => q + 1);
      setSelected(null);
    }, 550);
  }

  function moveNoButton() {
    const randomLeft = Math.floor(Math.random() * 76) + 4;
    const randomTop = Math.floor(Math.random() * 90) + 4;

    setNoPos({ left: randomLeft, top: randomTop });
  }

  function onNoTap(event) {
    event.preventDefault();
    if (noTaps >= 5) return;

    const next = noTaps + 1;
    setNoTaps(next);

    setResultMessage("");
    if (next < 5) {
      moveNoButton();
    }
  }

  function onYesTap() {
    if (yesTapAttempts < 2) {
      setYesTapAttempts((prev) => prev + 1);
      setYesSpinVariant((prev) => prev + 1);
      setYesSpinning(true);
      setTimeout(() => setYesSpinning(false), 760);
      return;
    }

    setResultMessage(finalContent.yesMessage);
  }

  if (isLoading) {
    return (
      <main className="app">
        <div className="card loading">Loading your love quiz...</div>
      </main>
    );
  }

  return (
    <main className="app">
      <FloatingHearts />

      {inQuiz && (
        <section className="card quiz-card">
          <h1>Love MCQ Quiz 💘</h1>
          <p className="subtitle">Pick any option — every answer is right.</p>

          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="progress-text">
            Question {currentQuestion + 1} of {questions.length}
          </p>

          <h2 className="question">{questions[currentQuestion].question}</h2>

          <div className="options">
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={option}
                className={`option-btn ${selected === index ? "correct" : ""}`}
                onClick={() => onOptionClick(index)}
                disabled={selected !== null}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      )}

      {inFinal && (
        <section className="card final-card">
          <div className="glow-ring" />
          <h2>{finalContent.title}</h2>
          <p className="subtitle">{finalContent.subtitle}</p>
          <p className="mini-score">
            You scored {score}/{questions.length} ✨
          </p>

          <div className="button-zone">
            <button
              className={`btn yes ${yesSpinning ? `spinning spin-v${yesSpinVariant % 2}` : ""}`}
              onClick={onYesTap}
            >
              Yes 💖
            </button>

            {noTaps < 5 && (
              <button
                className="btn no"
                style={{ left: `${noPos.left}%`, top: `${noPos.top}%` }}
                onPointerDown={onNoTap}
              >
                No 🙈
              </button>
            )}
          </div>

          <p className="status-line">
            {noTaps > 0 ? finalContent.noTaunts[Math.min(noTaps - 1, finalContent.noTaunts.length - 1)] : "Tap your choice 💫"}
          </p>
        </section>
      )}

      {resultMessage && (
        <section className="card result-card">
          <h2>Story Locked In 💞</h2>
          <p className="result-message">{resultMessage}</p>
          <div className="rose-row" aria-hidden="true">
            <span>🌹</span>
            <span>🌷</span>
            <span>🌹</span>
            <span>🌺</span>
            <span>🌹</span>
          </div>
          <p className="thanks-heart">💖 Thanks for loving and choosing me 💖</p>
        </section>
      )}
    </main>
  );
}

function FloatingHearts() {
  return (
    <div className="hearts" aria-hidden="true">
      <span>💖</span>
      <span>💕</span>
      <span>💗</span>
      <span>💘</span>
      <span>💞</span>
    </div>
  );
}
