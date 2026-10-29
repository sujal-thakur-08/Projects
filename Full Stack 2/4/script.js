// Get DOM elements
const counterDisplay = document.getElementById('counterDisplay');
const counterValue = document.querySelector('.counter-value');
const decrementBtn = document.getElementById('decrementBtn');
const resetBtn = document.getElementById('resetBtn');
const incrementBtn = document.getElementById('incrementBtn');
const stateLabel = document.getElementById('stateLabel');

// Counter state
let count = 0;

// Update counter display
function updateCounter() {
    counterValue.textContent = count;
    updateState();
}

// Update visual state based on counter value
function updateState() {
    // Remove all state classes
    counterDisplay.classList.remove('positive', 'negative', 'zero');
    stateLabel.classList.remove('positive', 'negative', 'zero');
    
    if (count > 0) {
        counterDisplay.classList.add('positive');
        stateLabel.classList.add('positive');
        stateLabel.textContent = 'Positive';
    } else if (count < 0) {
        counterDisplay.classList.add('negative');
        stateLabel.classList.add('negative');
        stateLabel.textContent = 'Negative';
    } else {
        counterDisplay.classList.add('zero');
        stateLabel.classList.add('zero');
        stateLabel.textContent = 'Neutral';
    }
}

// Event listeners
incrementBtn.addEventListener('click', () => {
    count++;
    updateCounter();
    animateButton(incrementBtn);
});

decrementBtn.addEventListener('click', () => {
    count--;
    updateCounter();
    animateButton(decrementBtn);
});

resetBtn.addEventListener('click', () => {
    count = 0;
    updateCounter();
    animateButton(resetBtn);
});

// Button animation
function animateButton(button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 100);
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === '+') {
        count++;
        updateCounter();
    } else if (e.key === 'ArrowDown' || e.key === '-') {
        count--;
        updateCounter();
    } else if (e.key === 'r' || e.key === 'R') {
        count = 0;
        updateCounter();
    }
});

// Initialize
updateCounter();
