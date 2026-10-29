const quizData = [
  {
    question: "Which one is the cutest love language?",
    options: ["Quality time", "Words of affirmation", "Acts of service", "All of the above 💞"],
  },
  {
    question: "Best plan for a romantic evening?",
    options: ["Long drive + songs", "Movie + snacks", "Walk + deep talks", "Anything together ❤️"],
  },
  {
    question: "What makes love stronger?",
    options: ["Trust", "Communication", "Respect", "All of these"],
  },
  {
    question: "If your person is sad, you should...",
    options: ["Listen patiently", "Hug them", "Cheer them up", "Do all three"],
  },
];

const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options");
const scoreBox = document.getElementById("score-box");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const quizCard = document.getElementById("quiz-card");
const finalCard = document.getElementById("final-card");

const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const finalMessage = document.getElementById("final-message");
const buttonArea = document.getElementById("button-area");

let currentQuestion = 0;
let score = 0;
let noEscapeCount = 0;

function loadQuestion() {
  const item = quizData[currentQuestion];
  questionText.textContent = `Q${currentQuestion + 1}. ${item.question}`;
  progressText.textContent = `Question ${currentQuestion + 1} of ${quizData.length}`;
  progressFill.style.width = `${((currentQuestion + 1) / quizData.length) * 100}%`;
  optionsContainer.innerHTML = "";

  item.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = option;
    btn.addEventListener("click", () => handleAnswer(btn));
    optionsContainer.appendChild(btn);
  });
}

function handleAnswer(button) {
  const allButtons = optionsContainer.querySelectorAll("button");

  allButtons.forEach((btn) => {
    btn.disabled = true;
  });

  button.classList.add("correct");
  score += 1;

  setTimeout(() => {
    currentQuestion += 1;
    if (currentQuestion < quizData.length) {
      loadQuestion();
    } else {
      showFinalStep();
    }
  }, 700);
}

function showFinalStep() {
  scoreBox.classList.remove("hidden");
  scoreBox.innerHTML = `<p>You scored <strong>${score}/${quizData.length}</strong> 💯</p>`;

  setTimeout(() => {
    quizCard.classList.add("hidden");
    finalCard.classList.remove("hidden");
    positionNoButton(62, 0);
  }, 900);
}

function positionNoButton(leftPercent, topPx) {
  noBtn.style.left = `${leftPercent}%`;
  noBtn.style.top = `${topPx}px`;
}

function moveNoButton() {
  if (noEscapeCount >= 5) {
    noBtn.style.display = "none";
    finalMessage.textContent = "Can't say no to me!";
    return;
  }

  const maxX = 75;
  const minX = 5;
  const randomLeft = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

  const areaHeight = buttonArea.clientHeight - noBtn.clientHeight;
  const randomTop = Math.max(0, Math.floor(Math.random() * Math.max(1, areaHeight)));

  positionNoButton(randomLeft, randomTop);
  finalMessage.textContent = "No button is running away 😜";
}

function handleYes() {
  buttonArea.innerHTML = '<p class="success">Yayyy! I knew it! 💕🥳</p>';
}

yesBtn.addEventListener("click", handleYes);

noBtn.addEventListener(
  "pointerdown",
  (event) => {
    event.preventDefault();
    noEscapeCount += 1;
    moveNoButton();
  },
  { passive: false }
);

loadQuestion();
