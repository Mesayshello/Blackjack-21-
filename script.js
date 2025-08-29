// Game state
let numPlayers = 1;
let players = [];  // Each player: {tokens, hand:[], bet, active:boolean, done:boolean}
let currentPlayerIndex = 0;
let dealerHand = [];
let deck = [];
let roundActive = false;

// DOM references
const playersInfoEl = document.getElementById("players-info");
const bettingSection = document.getElementById("betting-section");
const gameplaySection = document.getElementById("gameplay-section");
const currentPlayerNumEl = document.getElementById("current-player-num");
const betInput = document.getElementById("bet");

const playerIdEl = document.getElementById("player-id");
const playerTotalEl = document.getElementById("player-total");
const playerHandEl = document.getElementById("player-hand");
const dealerHandEl = document.getElementById("dealer-hand");
const dealerTotalEl = document.getElementById("dealer-total");
const resultEl = document.getElementById("result");

// Hide hit/stand buttons initially
document.getElementById("hit-btn").style.display = "none";
document.getElementById("stand-btn").style.display = "none";

function setupGame() {
  numPlayers = parseInt(document.getElementById("numPlayers").value);
  if (isNaN(numPlayers) || numPlayers < 1 || numPlayers > 4) {
    alert("Number of players must be between 1 and 4.");
    return;
  }

  players = [];
  for (let i = 0; i < numPlayers; i++) {
    players.push({
      tokens: 10,
      hand: [],
      bet: 0,
      active: false,
      done: false,
    });
  }

  currentPlayerIndex = 0;
  roundActive = false;
  dealerHand = [];

  updatePlayersInfo();

  // Reset UI for the first player's bet input
  bettingSection.style.display = "block";
  gameplaySection.style.display = "none";
  resultEl.textContent = "";
  currentPlayerNumEl.textContent = (currentPlayerIndex + 1);
  betInput.value = "1";

  // Clear hands and reset player states (for safety)
  players.forEach(p => {
    p.hand = [];
    p.done = false;
  });
  dealerHand = [];
}

function updatePlayersInfo() {
  playersInfoEl.innerHTML = "";
  players.forEach((p, i) => {
    const div = document.createElement("div");
    div.textContent = `Player ${i + 1}: ${p.tokens} tokens`;
    if (i === currentPlayerIndex) div.style.fontWeight = "bold";
    playersInfoEl.appendChild(div);
  });
}

// Called when player enters bet and clicks Deal
function startRound() {
  if (roundActive) return; // prevent double start
  let bet = parseInt(betInput.value);
  let player = players[currentPlayerIndex];
  if (isNaN(bet) || bet <= 0 || bet > player.tokens) {
    alert(`Invalid bet. Player ${currentPlayerIndex + 1} has ${player.tokens} tokens.`);
    return;
  }
  player.bet = bet;

  // Setup deck and hands on first player's first deal
  if (currentPlayerIndex === 0 && player.hand.length === 0) {
    createDeck();
    shuffleDeck();

    // Deal two cards to dealer (hidden)
    dealerHand = [];
    dealerHand.push(drawCard());
    dealerHand.push(drawCard());

    // Reset all players hands for new round
    players.forEach(p => {
      p.hand = [];
      p.done = false;
    });
  }

  // Deal two cards to current player only if new hand
  if (player.hand.length === 0) {
    player.hand.push(drawCard());
    player.hand.push(drawCard());
  }

  roundActive = true;

  bettingSection.style.display = "none";
  gameplaySection.style.display = "block";

  // Mark current player active
  players.forEach(p => p.active = false);
  player.active = true;

  updatePlayersInfo();
  updateDisplay(false);
  showPlayerButtons(true);
  resultEl.textContent = "";
  playerIdEl.textContent = currentPlayerIndex + 1;
}

// Player hits - gets another card
function hit() {
  if (!roundActive) return;
  let player = players[currentPlayerIndex];
  if (player.done) return;

  player.hand.push(drawCard());
  updateDisplay(false);

  if (calculateTotal(player.hand) > 21) {
    player.done = true;
    showPlayerButtons(false);
    resultEl.textContent = `Player ${currentPlayerIndex + 1} busted!`;
    nextTurn();
  }
}

// Player stands - ends their turn
function stand() {
  if (!roundActive) return;
  let player = players[currentPlayerIndex];
  player.done = true;
  showPlayerButtons(false);
  nextTurn();
}

// Move to next player or dealer turn
function nextTurn() {
  // Mark current player done and inactive
  players[currentPlayerIndex].done = true;
  players[currentPlayerIndex].active = false;

  currentPlayerIndex++;

  if (currentPlayerIndex >= numPlayers) {
    // All players done, dealer plays
    dealerTurn();
    return;
  }

  // Reset UI for next player's bet input
  bettingSection.style.display = "block";
  gameplaySection.style.display = "none";
  currentPlayerNumEl.textContent = currentPlayerIndex + 1;
  betInput.value = "1";

  updatePlayersInfo();
  resultEl.textContent = "";
  playerIdEl.textContent = "";
  playerTotalEl.textContent = "0";
  playerHandEl.innerHTML = "";
  dealerTotalEl.textContent = "?";

  roundActive = false;
  showPlayerButtons(false);
}

// Dealer plays after all players done
function dealerTurn() {
  // Reveal dealer hand fully
  updateDisplay(true);

  // Dealer hits until 17 or more
  while (calculateTotal(dealerHand) < 17) {
    dealerHand.push(drawCard());
    updateDisplay(true);
  }

  // Calculate results per player
  let dealerTotal = calculateTotal(dealerHand);
  let messages = [];

  players.forEach((p, idx) => {
    let playerTotal = calculateTotal(p.hand);
    if (playerTotal > 21) {
      // Player busted already
      p.tokens -= p.bet;
      messages.push(`Player ${idx + 1} busted and loses ${p.bet} tokens.`);
    } else if (dealerTotal > 21) {
      // Dealer busted, player wins
      p.tokens += p.bet;
      messages.push(`Player ${idx + 1} wins! +${p.bet} tokens.`);
    } else if (playerTotal > dealerTotal) {
      p.tokens += p.bet;
      messages.push(`Player ${idx + 1} wins! +${p.bet} tokens.`);
    } else if (playerTotal === dealerTotal) {
      messages.push(`Player ${idx + 1} draws. Bet returned.`);
      // no token change
    } else {
      p.tokens -= p.bet;
      messages.push(`Player ${idx + 1} loses ${p.bet} tokens.`);
    }
  });

  resultEl.innerHTML = messages.join("<br>");
  roundActive = false;
  showPlayerButtons(false);
  updatePlayersInfo();

  // Check tokens and reset if anyone is below or equal 0
  let resetNeeded = players.some(p => p.tokens <= 0);
  if (resetNeeded) {
    setTimeout(() => {
      alert("One or more players lost all tokens! Game will reset.");
      setupGame();
      bettingSection.style.display = "block";
      gameplaySection.style.display = "none";
    }, 2000);
  }
}

// Create a standard 52-card deck
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

// Shuffle deck with Fisher-Yates
function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// Draw top card from deck
function drawCard() {
  return deck.pop();
}

// Calculate total value of a hand, treating Aces as 1 or 11
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

// Update UI display of hands
// revealDealer: if true, show all dealer cards, else hide second card
function updateDisplay(revealDealer = false) {
  playerHandEl.innerHTML = "";
  dealerHandEl.innerHTML = "";

  const player = players[currentPlayerIndex];

  // Show current player's cards
  player.hand.forEach(card => {
    playerHandEl.appendChild(createCardElement(card));
  });
  playerTotalEl.textContent = calculateTotal(player.hand);

  // Show dealer cards
  dealerHand.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    if (index === 0 || revealDealer) {
      cardEl.textContent = `${card.value}${card.suit}`;
    } else {
      cardEl.textContent = "🂠"; // hidden card
    }
    dealerHandEl.appendChild(cardEl);
  });
  dealerTotalEl.textContent = revealDealer ? calculateTotal(dealerHand) : "?";
}

// Create a card DOM element
function createCardElement(card) {
  const div = document.createElement("div");
  div.className = "card";
  div.textContent = `${card.value}${card.suit}`;
  return div;
}

// Show or hide hit/stand buttons
function showPlayerButtons(show) {
  document.getElementById("hit-btn").style.display = show ? "inline-block" : "none";
  document.getElementById("stand-btn").style.display = show ? "inline-block" : "none";
}

// Initialize game on page load
setupGame();
