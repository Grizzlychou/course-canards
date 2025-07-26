// URL de votre Web App Apps Script (déploiement "Web App")
const scriptURL = 'https://script.google.com/macros/s/AKfycby47wFzKyuN5N_82DGX5uCds4VK8zgTdAWF2B9-sNMLGD8K8VTGcNcnT8dW7_48azeg/exec';

// Liste des numéros déjà réservés (sera remplie en appelant chargerStatuts)
const reservedNumbers = [];

// Paramètres de la grille : 17 lignes × 19 colonnes = 323 positions
const rows    = 17;
const cols    = 19;
const removed = [321, 322, 323]; // numéros retirés

// Références aux éléments du DOM
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

// Tableau de numéros sélectionnés par l’utilisateur
let selected = [];

/* ------------------- Fonctions ------------------- */

// Chargement des statuts depuis Google Sheets pour marquer les canards réservés
async function chargerStatuts() {
  reservedNumbers.length = 0;
  try {
    const response = await fetch(scriptURL);
    const rowsData = await response.json();
    rowsData.forEach(row => {
      if (row.Statut && row.Statut.toLowerCase() !== 'disponible') {
        reservedNumbers.push(parseInt(row.Numero, 10));
      }
    });
  } catch (err) {
    console.error('Erreur lors du chargement des statuts :', err);
  }
}

// Affiche la modale principale et génère la grille la première fois
reserveBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  modal.style.display = 'block';
  if (!duckGrid.dataset.generated) {
    await chargerStatuts();       // récupérer les canards déjà réservés
    generateGrid();
    duckGrid.dataset.generated = 'true';
  }
});

// Fermer la modale principale
closeModalBtn.addEventListener('click', function() {
  modal.style.display = 'none';
});

// Fermer les modales si on clique en dehors
window.addEventListener('click', function(e) {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
  if (e.target === confirmModal) {
    confirmModal.style.display = 'none';
  }
});

// Génération de la grille cliquable
function generateGrid() {
  const gridWidth  = duckGrid.offsetWidth;
  const gridHeight = gridWidth * (rows / cols);
  duckGrid.style.height = gridHeight + 'px';

  for (let i = 1; i <= rows * cols; i++) {
    if (removed.includes(i)) continue;
    const div = document.createElement('div');
    div.classList.add('duck');

    const row = Math.floor((i - 1) / cols);
    const col = (i - 1) % cols;
    const wPercent = 100 / cols;
    const hPercent = 100 / rows;

    div.style.width  = wPercent + '%';
    div.style.height = hPercent + '%';
    div.style.left   = (col * wPercent) + '%';
    div.style.top    = (row * hPercent) + '%';

    if (reservedNumbers.includes(i)) {
      div.classList.add('reserved');
    } else {
      div.addEventListener('click', function() {
        toggleSelection(i, div);
      });
    }
    duckGrid.appendChild(div);
  }
}

// Sélection ou désélection d’un canard
function toggleSelection(num, el) {
  const index = selected.indexOf(num);
  if (index > -1) {
    selected.splice(index, 1);
    el.classList.remove('selected');
  } else {
    selected.push(num);
    el.classList.add('selected');
  }
  updateSummary();
}

// Mise à jour du récapitulatif et du montant total
function updateSummary() {
  if (selected.length === 0) {
    selectedSpan.textContent = 'aucun';
  } else {
    const sorted = selected.slice().sort((a,b) => a - b);
    selectedSpan.textContent = sorted.join(', ');
  }
  totalSpan.textContent = (selected.length * 2) + ' €';
}

// Finaliser la commande : validation, envoi à Apps Script puis affichage de la confirmation
finaliserBtn.addEventListener('click', async function () {
  // Récupération des infos utilisateur
  const emailInput = document.getElementById('email');
  const email = emailInput.value.trim();
  const paymentMethod = document.querySelector('input[name="paiement"]:checked')?.value;
  const notifyNextYear = document.getElementById('notifyCheckbox').checked;
  const sendPaymentInfo = document.getElementById('paymentInfoCheckbox').checked;

  // Vérifications
  if (selected.length === 0) {
    alert("Veuillez sélectionner au moins un canard.");
    return;
  }
  if (!email || !email.includes('@')) {
    alert("Veuillez entrer une adresse email valide.");
    return;
  }
  if (!paymentMethod) {
    alert("Veuillez sélectionner un mode de paiement.");
    return;
  }

  // Construction des données à envoyer
  const payload = {
    numeros: selected,
    nom: '', // À compléter si tu ajoutes un champ nom
    email: email,
    moyenPaiement: paymentMethod,
    notifyNextYear: notifyNextYear,
    sendPaymentInfo: sendPaymentInfo
  };

  try {
    await fetch(scriptURL, {
      method: 'POST',
      mode: 'no-cors', // permet d’envoyer sans erreur CORS mais sans lire la réponse
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    await chargerStatuts(); // Mise à jour des canards réservés
    modal.style.display = 'none';
    showConfirmation(paymentMethod, email, notifyNextYear, sendPaymentInfo);
    selected = [];
    updateSummary();
  } catch (err) {
    console.warn("La requête a été envoyée, mais la réponse n'a pas pu être lue :", err);
    modal.style.display = 'none';
    showConfirmation(paymentMethod, email, notifyNextYear, sendPaymentInfo);
    selected = [];
    updateSummary();
  }
});


// Construire et afficher le récapitulatif de confirmation
function showConfirmation(paymentMethod, email, notifyNextYear, sendPaymentInfo) {
  // Message de base avec les numéros triés
  let message  = "Vous avez réservé les canards : " +
    selected.slice().sort((a, b) => a - b).join(', ');

  // Ajout du total
  message += "<br>Total : " + (selected.length * 2) + " €";

  // Ajout de la méthode de paiement
  message += "<br>Méthode de paiement : " +
    (paymentMethod === 'virement' ? 'Par virement' : "En espèces le jour de l'évènement");

  // Si virement, ajouter les coordonnées bancaires
  if (paymentMethod === 'virement') {
    message += "<br><br><strong>Veuillez effectuer votre virement à :</strong><br>";
    message += "IBAN : BE00 0000 0000 0000<br>BIC : ABCDBEBE<br>Communication : Course des canards + votre nom";
  }

  // Ajouter l'adresse e-mail
  message += "<br><br>Un e‑mail de confirmation sera envoyé à : " + email;

  // Ajouter les options de notification
  if (notifyNextYear) {
    message += "<br>• Vous recevrez une invitation pour la prochaine édition.";
  }
  if (sendPaymentInfo) {
    message += "<br>• Les informations de paiement vous seront renvoyées par e‑mail.";
  }

  // Afficher le message dans la fenêtre de confirmation
  confirmText.innerHTML = message;
  confirmModal.style.display = 'block';
}


// Fermer la modale de confirmation
closeConfirm.addEventListener('click', function() {
  confirmModal.style.display = 'none';
});
