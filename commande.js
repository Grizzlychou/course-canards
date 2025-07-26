// Liste des numéros déjà réservés (à remplir selon vos réservations existantes)
const reservedNumbers = [];

// Paramètres de la grille (17 lignes × 19 colonnes = 323 positions, dont trois retirées)
const rows    = 17;
const cols    = 19;
const removed = [321, 322, 323]; // numéros de canards supprimés (laissés vides)

// Sélection des éléments du DOM
const reserveBtn    = document.getElementById('reserve-button');
const modal         = document.getElementById('duckModal');
const closeModalBtn = document.getElementById('closeModal');
const duckGrid      = document.getElementById('duckGrid');
const selectedSpan  = document.getElementById('selectedNumbers');
const totalSpan     = document.getElementById('totalCost');
const finaliserBtn  = document.getElementById('finaliser');

const confirmModal  = document.getElementById('confirmModal');
const closeConfirm  = document.getElementById('closeConfirm');
const confirmText   = document.getElementById('confirmText');

// Tableau pour stocker les numéros sélectionnés
let selected = [];

/* --- Fonctions principales --- */

// Ouvrir la fenêtre modale lorsqu’on clique sur “Réserver mon canard”
reserveBtn.addEventListener('click', function(e) {
  e.preventDefault();
  modal.style.display = 'block';
  // Générer la grille la première fois uniquement
  if (!duckGrid.dataset.generated) {
    generateGrid();
    duckGrid.dataset.generated = 'true';
  }
});

// Fermer la modale en cliquant sur la croix
closeModalBtn.addEventListener('click', function() {
  modal.style.display = 'none';
});
// Fermer la modale si l’on clique en dehors du contenu
window.addEventListener('click', function(e) {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
  if (e.target === confirmModal) {
    confirmModal.style.display = 'none';
  }
});

// Générer la grille de canards et positionner les zones cliquables
function generateGrid() {
  const gridWidth  = duckGrid.offsetWidth;
  const gridHeight = gridWidth * (rows / cols);
  duckGrid.style.height = gridHeight + 'px';

  for (let i = 1; i <= rows * cols; i++) {
    if (removed.includes(i)) continue; // laisser vide les numéros retirés

    const div = document.createElement('div');
    div.classList.add('duck');

    // Calculer la position du canard en pourcentage
    const row = Math.floor((i - 1) / cols);
    const col = (i - 1) % cols;
    const wPercent = 100 / cols;
    const hPercent = 100 / rows;

    div.style.width  = wPercent + '%';
    div.style.height = hPercent + '%';
    div.style.left   = (col * wPercent) + '%';
    div.style.top    = (row * hPercent) + '%';

    if (reservedNumbers.includes(i)) {
      // Canard déjà réservé : on le colore en rouge et on désactive le clic
      div.classList.add('reserved');
    } else {
      // Sinon, on ajoute un gestionnaire de clic pour sélectionner/désélectionner
      div.addEventListener('click', function() {
        toggleSelection(i, div);
      });
    }

    duckGrid.appendChild(div);
  }
}

// Sélectionner ou désélectionner un canard
function toggleSelection(number, element) {
  const index = selected.indexOf(number);
  if (index > -1) {
    // Si déjà sélectionné, on l’enlève
    selected.splice(index, 1);
    element.classList.remove('selected');
  } else {
    // Sinon, on l’ajoute
    selected.push(number);
    element.classList.add('selected');
  }
  updateSummary();
}

// Mettre à jour le récapitulatif des canards sélectionnés et le total
function updateSummary() {
  if (selected.length === 0) {
    selectedSpan.textContent = 'aucun';
  } else {
    // Afficher les numéros triés
    const sorted = selected.slice().sort(function(a, b) { return a - b; });
    selectedSpan.textContent = sorted.join(', ');
  }
  // 2 € par canard
  totalSpan.textContent = (selected.length * 2) + ' €';
}

/* --- Gestion du formulaire et de la confirmation --- */

// Lorsque l’on clique sur “Finaliser ma commande”
finaliserBtn.addEventListener('click', function() {
  // Vérifier qu’il y a au moins un canard sélectionné
  if (selected.length === 0) {
    alert("Vous n'avez sélectionné aucun canard.");
    return;
  }
  // Vérifier l’e-mail
  const emailField = document.getElementById('email');
  const email = emailField.value.trim();
  if (email === "") {
    alert("Veuillez saisir votre adresse e‑mail.");
    emailField.focus();
    return;
  }
  // Récupérer la méthode de paiement choisie
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
  // Récupérer les options de notification
  const notifyNextYear  = document.getElementById('notifyNextYear').checked;
  const sendPaymentInfo = document.getElementById('sendPaymentInfo').checked;

  // Construire le message de confirmation
  let message  = "Vous avez réservé les canards : " +
    selected.slice().sort(function(a,b){return a-b;}).join(', ');
  message += "<br>Total : " + (selected.length * 2) + " €";
  message += "<br>Méthode de paiement : " +
    (paymentMethod === "virement" ? "Par virement" : "En espèces le jour de l'évènement");
  if (paymentMethod === "virement") {
    message += "<br><br><strong>Veuillez effectuer votre virement à :</strong><br>";
    message += "IBAN : BE00 0000 0000 0000<br>BIC : ABCDBEBE<br>Communication : Course des canards + votre nom";
  }
  message += "<br><br>Un e‑mail de confirmation sera envoyé à : " + email;
  if (notifyNextYear) {
    message += "<br>• Vous recevrez une invitation pour la prochaine édition.";
  }
  if (sendPaymentInfo) {
    message += "<br>• Les informations de paiement vous seront renvoyées par e‑mail.";
  }

  // Afficher la modale de confirmation avec ce message
  confirmText.innerHTML = message;
  confirmModal.style.display = 'block';
});

// Fermer la modale de confirmation
closeConfirm.addEventListener('click', function() {
  confirmModal.style.display = 'none';
});
