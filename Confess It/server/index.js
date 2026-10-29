const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const questions = [
  {
    id: 1,
    question: "Which vibe is best for a perfect date?",
    options: ["Rain + chai", "Long drive", "Movie night", "Any plan together 💖"],
  },
  {
    id: 2,
    question: "What matters most in love?",
    options: ["Trust", "Care", "Loyalty", "Everything above ✨"],
  },
  {
    id: 3,
    question: "Your partner sends 'I miss you'. You reply...",
    options: ["I miss you more", "Come fast 😌", "Big virtual hug", "All of these 💕"],
  },
  {
    id: 4,
    question: "Pick your love anthem style:",
    options: ["Soft romantic", "Bollywood classic", "Indie dreamy", "Anything with us in it 🎶"],
  },
];

app.get("/api/questions", (_req, res) => {
  res.json({ questions });
});

app.get("/api/final-content", (_req, res) => {
  res.json({
    title: "Final Question 💌",
    subtitle: "Will you be my forever person?",
    noTaunts: [
      "Nope, that button slipped away 😜",
      "Still trying? It's too shy 🙈",
      "Love says choose Yes 💘",
      "Almost there...",
      "No vanished into thin air ✨",
    ],
    yesMessage: " Aww !! you choose a green forest! 🥹 PK 💖",

  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const clientDistPath = path.join(__dirname, "..", "client", "dist");

app.use(express.static(clientDistPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
