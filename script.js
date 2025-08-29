let tokens = 10;
let playerHand = [];
let dealerHand = [];
let deck = [];
let bet = 1;

const playerTotalEl = document.getElementById("player-total");
const dealerTotalEl = document.getElementById("dealer-total");
const playerHandEl = document.getElementById("player-hand");
const dealerHandEl = document.getElementById("dealer-hand");
const resultEl = document.getElementById("result");
const tokensEl = document.getElementById("tokens");
const betInput = document.getElementById("bet");

document.getElementById("hit-btn").style.display = "none";
document.getElementById("stand-btn").style.display = "none";

function startRound() {
  bet = parseInt(betInput.value);
  if (bet <= 0 || bet > tokens) {
    alert("Invalid bet amount.");
    return;
  }

  resetHands();
  createDeck();
  shuffleDeck();

  playerHand.push(drawCard());
  dealerHand.push(drawCard());
  playerHand.push(drawCard());
  dealerHand.push(drawCard());

  updateDisplay(false);

  resultEl.textContent = "";
  document.getElementById("hit-btn").style.display = "inline-block";
  document.getElementById("stand-btn").style.display = "inline-block";
}

function hit() {
  playerHand.push(drawCard());
  updateDisplay(false);

  if (calculateTotal(playerHand) > 21) {
    updateDisplay(true); // Reveal dealer hand
    endRound("bust");
  }
}

function stand() {
  while (calculateTotal(dealerHand) < 17) {
    dealerHand.push(drawCard());
  }
  updateDisplay(true); // Reveal dealer hand
  checkWinner();
}

function endRound(outcome) {
  document.getElementById("hit-btn").style.display = "none";
  document.getElementById("stand-btn").style.display = "none";

  if (outcome === "win") {
    tokens += bet;
    resultEl.textContent = `You win! +${bet} tokens.`;
  } else if (outcome === "bust" || outcome === "lose") {
    tokens -= bet;
    resultEl.textContent = `You lose. -${bet} tokens.`;
  }

  updateTokens();

  if (tokens <= 0) {
    setTimeout(() => {
      alert("You lost all your tokens! Game will restart.");
      tokens = 10;
      updateTokens();
    }, 500);
  }
}

function checkWinner() {
  const playerTotal = calculateTotal(playerHand);
  const dealerTotal = calculateTotal(dealerHand);

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    endRound("win");
  } else if (dealerTotal === playerTotal) {
    resultEl.textContent = "It's a draw. Bet returned.";
  } else {
    endRound("lose");
  }
}

function resetHands() {
  playerHand = [];
  dealerHand = [];
  playerHandEl.innerHTML = "";
  dealerHandEl.innerHTML = "";
}

function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  deck = [];

  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawCard() {
  return deck.pop();
}

function calculateTotal(hand) {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (["J", "Q", "K"].includes(card.value)) {
      total += 10;
    } else if (card.value === "A") {
      total += 11;
      aces++;
    } else {
      total += parseInt(card.value);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function updateDisplay(revealDealer = false) {
  playerHandEl.innerHTML = "";
  dealerHandEl.innerHTML = "";

  playerHand.forEach(card => {
    playerHandEl.appendChild(createCardElement(card));
  });

  dealerHand.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    if (index === 0 || revealDealer) {
      cardEl.textContent = `${card.value}${card.suit}`;
    } else {
      cardEl.textContent = "🂠"; // Hidden card
    }
    dealerHandEl.appendChild(cardEl);
  });

  playerTotalEl.textContent = calculateTotal(playerHand);
  dealerTotalEl.textContent = revealDealer ? calculateTotal(dealerHand) : "?";
}

function createCardElement(card) {
  const div = document.createElement("div");
  div.className = "card";
  div.textContent = `${card.value}${card.suit}`;
  return div;
}

function updateTokens() {
  tokensEl.textContent = `Tokens: ${tokens}`;
}
