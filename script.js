// Supabase Konfiguration
// Bitte ersetze diese Werte mit deinen Supabase Credentials
const SUPABASE_URL = 'https://sdhcncuencyhljpdquxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkaGNuY3VlbmN5aGxqcGRxdXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjcwMjAsImV4cCI6MjA4MjYwMzAyMH0.P2OTt99Bq9i9cc2BLZF1HtN4bfxFgmC1e1FxWA92lb4';

// Supabase Client initialisieren
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elemente
const loginContainer = document.getElementById('login-container');
const loggedInContainer = document.getElementById('logged-in-container');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const errorMessage = document.getElementById('error-message');

let isveranstalter = false; // Globale Variable für die Rolle

// Hilfsfunktion: Konvertiert eine Bilddatei (File) in ein WebP Blob
async function convertToWebP(file, quality = 0.8) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Ungültige Datei oder kein Bildformat.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width, img.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Fehler bei der WebP-Konvertierung.'));
                    }
                }, 'image/webp', quality);
            };
            img.onerror = () => {
                reject(new Error('Fehler beim Laden des Bildes zur Konvertierung.'));
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            reject(new Error('Fehler beim Lesen der Datei.'));
        };
        reader.readAsDataURL(file);
    });
}

// Prüfe ob Benutzer bereits angemeldet ist
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        showLoggedIn();
    } else {
        showLogin();
    }
}

// Zeige Login-Formular
function showLogin() {
    loginContainer.classList.remove('hidden');
    loggedInContainer.classList.add('hidden');
    errorMessage.textContent = '';
}

// Initialisiere die Ansicht nach dem Login basierend auf der Benutzerrolle
async function initializeLoggedInView() {
    loadProfilePicture(); // Profilbild immer laden
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        console.error('Kein eingeloggter Benutzer gefunden.');
        showLogin(); // Zurück zum Login, falls kein User
        return;
    }

    const cardsManagementHeading = document.getElementById('cards-management-heading');
    const cardsGrid = document.getElementById('cards-grid');
    const permissionMessage = document.getElementById('permission-message');

    // Elemente initial ausblenden, um Flackern zu vermeiden (ausgenommen cardsManagementHeading)
    if (cardsGrid) cardsGrid.classList.add('hidden');
    if (permissionMessage) permissionMessage.classList.add('hidden');

    // cardsManagementHeading sollte immer sichtbar sein, wenn eingeloggt
    if (cardsManagementHeading) cardsManagementHeading.classList.remove('hidden');

    try {
        const { data: userData, error } = await supabaseClient
            .from('users')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (error || !userData) {
            console.error('Fehler beim Abrufen der Benutzerrolle:', error);
            isveranstalter = false;
        } else {
            isveranstalter = (userData.role === 'veranstalter');
        }

        if (isveranstalter) {
            console.log('Benutzer ist veranstalter. Zeige Kartenverwaltung.');
            if (cardsGrid) cardsGrid.classList.remove('hidden'); // Kartenraster anzeigen
            loadCards(); // Karten laden, da Berechtigung vorhanden
        } else {
            console.log('Benutzer ist kein veranstalter. Verstecke Kartenverwaltung.');
            if (permissionMessage) {
                permissionMessage.textContent = 'Sie haben keine Berechtigung, Cards zu verwalten. Bitte kontaktieren Sie den Administrator.';
                permissionMessage.classList.remove('hidden');
            }
            if (cardsGrid) cardsGrid.innerHTML = ''; // Leere das Grid, falls Inhalte ohne Berechtigung angezeigt wurden
        }
    } catch (error) {
        console.error('Fehler bei initializeLoggedInView:', error);
        isveranstalter = false;
        if (permissionMessage) {
            permissionMessage.textContent = 'Ein Fehler ist aufgetreten beim Laden der Berechtigungen.';
            permissionMessage.classList.remove('hidden');
        }
    }
}

// Zeige "angemeldet" Anzeige
function showLoggedIn() {
    loginContainer.classList.add('hidden');
    loggedInContainer.classList.remove('hidden');
    initializeLoggedInView(); // Rufe die neue Funktion auf
}

// Login Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        errorMessage.textContent = error.message;
    } else {
        showLoggedIn();
        loginForm.reset();
    }
});

// Logout Handler
logoutBtn.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
        errorMessage.textContent = error.message;
    } else {
        showLogin();
    }
});

// Auth State Listener - reagiert auf Auth-Änderungen
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        showLoggedIn();
    } else {
        showLogin();
    }
});

// Card Management
const cardsGrid = document.getElementById('cards-grid');
let editingCardId = null;
let showNewCardFormFlag = false;

// Lade alle Cards des angemeldeten Users
async function loadCards() {
    // Hole aktuellen User
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
        console.error('Fehler beim Laden des Users:', userError);
        return;
    }
    
    console.log('👤 Lade Cards für User:', user.id);
    
    // Lade nur Cards die vom aktuellen User erstellt wurden
    const { data, error } = await supabaseClient
        .from('cards')
        .select('*')
        .eq('created_by', user.id)
        .order('unlocked_at', { ascending: false });
    
    if (error) {
        console.error('Fehler beim Laden der Cards:', error);
        return;
    }
    
    console.log('📋 Gefundene Cards:', data?.length || 0);
    renderCards(data || []);
}

// Rendere Cards im Grid
function renderCards(cards) {
    let html = '';

    // Plus-Card für neue Card hinzufügen (nur wenn Benutzer Veranstalter ist)
    if (isveranstalter) {
        if (!showNewCardFormFlag) {
            html += `
                <div class="card new-card" id="new-card">
                    <div class="new-card-content" onclick="showNewCardForm(event)">
                        <div class="plus-icon">+</div>
                        <div class="new-card-text">Neue Card</div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="card new-card editing" id="new-card">
                    <form class="card-form-inline" onsubmit="saveNewCard(event)">
                        <div class="preset-actions">
                            <button type="button" class="card-btn" onclick="savePreset(this)">Preset speichern</button>
                            <button type="button" class="card-btn" onclick="showPresetSelection(this)">Aus Preset füllen</button>
                        </div>
                        <div class="preset-selection hidden"></div>
                        <div class="card-image-upload-container">
                            <label class="card-image-label">
                                <img src="" alt="Vorschau" class="card-image-preview" style="display: none;">
                                <input type="file" class="card-input-image" accept="image/*" onchange="previewImage(this)">
                                <span class="card-image-upload-text">Bild auswählen</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="card-input-title">Titel</label>
                            <input type="text" id="card-input-title" class="card-input-title" placeholder="Card Titel" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-description">Motto</label>
                            <input type="text" id="card-input-description" class="card-input-description" placeholder="Card Motto" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-nfc">NFC ID</label>
                            <input type="text" id="card-input-nfc" class="card-input-nfc" placeholder="NFC ID" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-date">Freischaltdatum</label>
                            <input type="datetime-local" id="card-input-date" class="card-input-date" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-address">Adresse</label>
                            <input type="text" id="card-input-address" class="card-input-address" placeholder="Adresse" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-price">Preis</label>
                            <input type="number" id="card-input-price" class="card-input-price" placeholder="Preis" step="0.01" required>
                        </div>
                        <div class="time-inputs">
                            <div class="form-group">
                                <label for="card-input-time-start">Startzeit</label>
                                <input type="time" id="card-input-time-start" class="card-input-time-start" placeholder="Startzeit" required>
                            </div>
                            <div class="form-group">
                                <label for="card-input-time-end">Endzeit</label>
                                <input type="time" id="card-input-time-end" class="card-input-time-end" placeholder="Endzeit" required>
                            </div>
                        </div>
                        <div class="card-form-actions">
                            <button type="submit" class="card-btn save">Speichern</button>
                            <button type="button" class="card-btn cancel" onclick="cancelNewCard()">Abbrechen</button>
                        </div>
                    </form>
                </div>
            `;
        }
    }
    
    // Bestehende Cards rendern
    html += cards.map(card => {
        const isEditing = editingCardId === card.card_id;
        
        if (isEditing) {
            // Edit-Modus: Formular in der Card (Nur für veranstalter sichtbar)
            const imageUrl = getCardImageUrl(card.card_id);
            return `
                <div class="card editing" data-card-id="${card.card_id}">
                    <form class="card-form-inline" onsubmit="saveCardInline(event)">
                        <div class="preset-actions">
                            <button type="button" class="card-btn" onclick="savePreset(this)">Preset speichern</button>
                            <button type="button" class="card-btn" onclick="showPresetSelection(this)">Aus Preset füllen</button>
                        </div>
                        <div class="preset-selection hidden"></div>
                        <input type="hidden" class="card-id-hidden" value="${card.card_id}">
                        <div class="card-image-upload-container">
                            <label class="card-image-label">
                                <img src="${imageUrl}" alt="Aktuelles Bild" class="card-image-preview" onerror="this.style.display='none'">
                                <input type="file" class="card-input-image" accept="image/*" onchange="previewImage(this)">
                                <span class="card-image-upload-text">Bild auswählen</span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="card-input-title-${card.card_id}">Titel</label>
                            <input type="text" id="card-input-title-${card.card_id}" class="card-input-title" value="${escapeHtml(card.card_title || '')}" placeholder="Card Titel" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-description-${card.card_id}">Motto</label>
                            <input type="text" id="card-input-description-${card.card_id}" class="card-input-description" value="${escapeHtml(card.card_motto || '')}" placeholder="Card Motto" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-nfc-${card.card_id}">NFC ID</label>
                            <input type="text" id="card-input-nfc-${card.card_id}" class="card-input-nfc" value="${escapeHtml(card.card_nfc_id || '')}" placeholder="NFC ID" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-date-${card.card_id}">Freischaltdatum</label>
                            <input type="datetime-local" id="card-input-date-${card.card_id}" class="card-input-date" value="${formatDateForInput(card.unlocked_at)}" required>
                        </div>
                        <input type="hidden" id="card-input-xp-${card.card_id}" class="card-input-xp" value="${card.xp_grant || 25}">
                        <div class="form-group">
                            <label for="card-input-address-${card.card_id}">Adresse</label>
                            <input type="text" id="card-input-address-${card.card_id}" class="card-input-address" value="${escapeHtml(card.card_adress || '')}" placeholder="Adresse" required>
                        </div>
                        <div class="form-group">
                            <label for="card-input-price-${card.card_id}">Preis</label>
                            <input type="number" id="card-input-price-${card.card_id}" class="card-input-price" value="${card.card_price || ''}" placeholder="Preis" step="0.01" required>
                        </div>
                        <div class="time-inputs">
                            <div class="form-group">
                                <label for="card-input-time-start-${card.card_id}">Startzeit</label>
                                <input type="time" id="card-input-time-start-${card.card_id}" class="card-input-time-start" value="${card.card_time_start || ''}" placeholder="Startzeit" required>
                            </div>
                            <div class="form-group">
                                <label for="card-input-time-end-${card.card_id}">Endzeit</label>
                                <input type="time" id="card-input-time-end-${card.card_id}" class="card-input-time-end" value="${card.card_time_end || ''}" placeholder="Endzeit" required>
                            </div>
                        </div>
                        <div class="card-form-actions">
                            <button type="submit" class="card-btn save">Speichern</button>
                            <button type="button" class="card-btn cancel" onclick="cancelEdit(${card.card_id})">Abbrechen</button>
                        </div>
                    </form>
                </div>
            `;
        } else {
            // Anzeige-Modus: Normale Card
            const imageUrl = getCardImageUrl(card.card_id);
            // Prüfe ob Card in der Vergangenheit liegt
            const isPastCard = card.unlocked_at && new Date(card.unlocked_at) < new Date();
            const pastCardClass = isPastCard ? ' past-card' : '';
            return `
                <div class="card${pastCardClass}" data-card-id="${card.card_id}">
                    <div class="card-image-container">
                        <img src="${imageUrl}" alt="${escapeHtml(card.card_title || '')}" class="card-image" data-card-id="${card.card_id}" onerror="tryImageUrl(this, ${card.card_id})">
                    </div>
                    <div class="card-title">${escapeHtml(card.card_title || '')}</div>
                    <div class="card-description">${escapeHtml(card.card_motto || '')}</div>
                    <div class="card-meta">
                        <small><strong>NFC ID:</strong> ${escapeHtml(card.card_nfc_id || '')}</small>
                        <small><strong>Freischaltdatum:</strong> ${formatDate(card.unlocked_at)}</small>
                        <small><strong>XP Grant:</strong> ${card.xp_grant || 0}</small>
                        <small><strong>Adresse:</strong> ${escapeHtml(card.card_adress || '')}</small>
                        <small><strong>Preis:</strong> ${card.card_price !== undefined && card.card_price !== null ? card.card_price.toFixed(2) + '€' : 'N/A'}</small>
                        <small><strong>Zeit:</strong> ${card.card_time_start || 'N/A'} - ${card.card_time_end || 'N/A'}</small>
                    </div>
                    ${isveranstalter ? `
                        <div class="card-actions">
                            <button class="card-btn edit" onclick="editCardInline(${card.card_id})">Bearbeiten</button>
                            <button class="card-btn delete" onclick="deleteCard(${card.card_id})">Löschen</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }).join('');
    
    cardsGrid.innerHTML = html;
    
    // Wenn der Benutzer ein veranstalter ist und das "Neue Card" Formular angezeigt werden soll,
    // fokussiere das erste Feld. Ansonsten wird dies durch initializeLoggedInView gehandhabt.
    if (isveranstalter && showNewCardFormFlag) {
        setTimeout(() => {
            const firstInput = document.querySelector('#new-card .card-input-title');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }
}

// Datum für datetime-local Input formatieren
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// HTML Escaping für Sicherheit
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Datum formatieren
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('de-DE');
}

// Bild-URL für Card generieren - versucht verschiedene Dateierweiterungen
function getCardImageUrl(cardId) {
    if (!cardId) return '';
    const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/Card_images/`;
    // Priorisiere webp, da wir jetzt alles in webp speichern
    const extensions = ['webp', 'jpg', 'jpeg', 'png']; 
    
    // Für jetzt nehmen wir webp als Standard, aber das Bild-Tag wird onerror verwenden
    // um andere Erweiterungen zu versuchen
    // Cache-Busting mit Timestamp, damit neue Bilder sofort angezeigt werden
    const timestamp = new Date().getTime();
    return `${baseUrl}${cardId}.${extensions[0]}?t=${timestamp}`; // Versuche zuerst WebP
}

// Versuche verschiedene Bild-URLs wenn eine fehlschlägt
// Da wir jetzt nur noch webp speichern, bedeutet ein Fehler beim Laden, dass das Bild nicht existiert.
window.tryImageUrl = function(img, cardId) {
    if (!cardId) {
        img.style.display = 'none';
        return;
    }
    // Wenn das onerror Event ausgelöst wird, bedeutet es, dass das Bild unter der WebP-URL
    // nicht existiert. Daher einfach ausblenden.
    img.style.display = 'none';
};

// Bild-Vorschau beim Upload
window.previewImage = async function(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const preview = input.closest('.card-image-upload-container').querySelector('.card-image-preview');
        const label = input.closest('.card-image-label');
        
        // Konvertiere das Bild in WebP für die Vorschau
        try {
            const webpBlob = await convertToWebP(file);
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                label.querySelector('.card-image-upload-text').textContent = 'Bild ändern';
            };
            reader.readAsDataURL(webpBlob);
        } catch (error) {
            console.error('Fehler bei der WebP-Konvertierung für Bild-Vorschau:', error);
            alert('Fehler bei der Bildvorschau: ' + error.message);
            preview.src = '';
            preview.style.display = 'none';
        }
    }
};

// Profilbild-URL generieren
function getProfilePictureUrl(userId) {
    if (!userId) return '';
    const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/veranstalter/`;
    const timestamp = new Date().getTime();
    return `${baseUrl}${userId}.webp?t=${timestamp}`; // Standardmäßig .webp
}

// Profilbild laden
async function loadProfilePicture() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    
    const profilePicture = document.getElementById('profile-picture');
    if (!profilePicture) return;
    
    // Stelle sicher, dass das Element immer sichtbar ist
    profilePicture.style.display = 'block';
    
    // Setze no-image Klasse als Standard (blauer Kreis)
    profilePicture.classList.add('no-image');
    profilePicture.src = '';
    
    const imageUrl = getProfilePictureUrl(user.id); // Diese URL ist jetzt schon .webp

    // Versuche Bild zu laden (primär .webp)
    const testImage = new Image();
    testImage.onload = function() {
        // Bild existiert, entferne no-image Klasse und setze src
        profilePicture.classList.remove('no-image');
        profilePicture.src = imageUrl;
    };
    
    testImage.onerror = function() {
        // Da nur noch webp gespeichert wird, bedeutet ein Fehler hier, dass kein Profilbild existiert.
        // Behalte den blauen Kreis (no-image Klasse) und blende das src-Bild aus.
        profilePicture.classList.add('no-image');
        profilePicture.src = '';
        profilePicture.style.display = 'block'; // Sicherstellen, dass der Container sichtbar bleibt
    };
    
    testImage.src = imageUrl;
}

// Profil-Modal öffnen
window.openProfileModal = async function() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    // Lade aktuelle Profildaten
    await loadProfileData();
    
    // Schließe Modal beim Klick außerhalb
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeProfileModal();
        }
    };
};

// Profil-Modal schließen
window.closeProfileModal = function() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Profildaten laden
async function loadProfileData() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    
    try {
        // Lade Benutzerdaten aus users-Tabelle
        const { data: userData, error } = await supabaseClient
            .from('users')
            .select('username')
            .eq('user_id', user.id)
            .single();
        
        // Setze veranstaltername (username)
        const usernameInput = document.getElementById('profile-username');
        if (usernameInput) {
            usernameInput.value = userData?.username || '';
        }
        
        // Lade Profilbild-Vorschau
        const profilePreview = document.getElementById('profile-preview');
        if (profilePreview) {
            const profileUrl = getProfilePictureUrl(user.id);
            const testImage = new Image();
            testImage.onload = function() {
                profilePreview.src = profileUrl;
                profilePreview.style.display = 'block';
            };
            testImage.onerror = function() {
                profilePreview.style.display = 'none';
            };
            testImage.src = profileUrl;
        }
        
        // Lade Placeholder-Bild-Vorschau
        const placeholderPreview = document.getElementById('placeholder-preview');
        if (placeholderPreview) {
            const placeholderUrl = getPlaceholderImageUrl(user.id);
            const testImage = new Image();
            testImage.onload = function() {
                placeholderPreview.src = placeholderUrl;
                placeholderPreview.style.display = 'block';
            };
            testImage.onerror = function() {
                placeholderPreview.style.display = 'none';
            };
            testImage.src = placeholderUrl;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Profildaten:', error);
    }
}

// Placeholder-Bild-URL generieren
function getPlaceholderImageUrl(userId) {
    if (!userId) return '';
    const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/veranstalter/`;
    const timestamp = new Date().getTime();
    return `${baseUrl}placeholder_${userId}.webp?t=${timestamp}`; // Standardmäßig .webp
}

// Profilbild-Vorschau
window.previewProfileImage = async function(input) {
    const preview = document.getElementById('profile-preview');
    if (!preview || !input.files || !input.files[0]) return;
    
    // Konvertiere das Bild in WebP für die Vorschau
    try {
        const webpBlob = await convertToWebP(input.files[0]);
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(webpBlob);
    } catch (error) {
        console.error('Fehler bei der WebP-Konvertierung für Profilbild-Vorschau:', error);
        alert('Fehler bei der Profilbild-Vorschau: ' + error.message);
        preview.src = '';
        preview.style.display = 'none';
    }
};

// Placeholder-Bild-Vorschau
window.previewPlaceholderImage = async function(input) {
    const preview = document.getElementById('placeholder-preview');
    if (!preview || !input.files || !input.files[0]) return;
    
    // Konvertiere das Bild in WebP für die Vorschau
    try {
        const webpBlob = await convertToWebP(input.files[0]);
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(webpBlob);
    } catch (error) {
        console.error('Fehler bei der WebP-Konvertierung für Placeholder-Vorschau:', error);
        alert('Fehler bei der Placeholder-Vorschau: ' + error.message);
        preview.src = '';
        preview.style.display = 'none';
    }
};

// Profil speichern
window.saveProfile = async function(e) {
    e.preventDefault();
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('Du bist nicht angemeldet.');
        return;
    }
    
    const usernameInput = document.getElementById('profile-username');
    const profilePictureInput = document.getElementById('profile-picture-upload');
    const placeholderPictureInput = document.getElementById('placeholder-picture-upload');
    
    const veranstaltername = usernameInput?.value.trim() || '';
    
    try {
        // Speichere veranstaltername in users-Tabelle
        const { error: updateError } = await supabaseClient
            .from('users')
            .update({ 
                username: veranstaltername
            })
            .eq('user_id', user.id);
        
        if (updateError) {
            console.error('Fehler beim Speichern des veranstalternamens:', updateError);
            alert('Fehler beim Speichern des veranstalternamens: ' + updateError.message);
        }
        
        // Lade Profilbild hoch, falls ausgewählt
        if (profilePictureInput?.files && profilePictureInput.files[0]) {
            await uploadProfilePictureFile(profilePictureInput.files[0]);
        }
        
        // Lade Placeholder-Bild hoch, falls ausgewählt
        if (placeholderPictureInput?.files && placeholderPictureInput.files[0]) {
            await uploadPlaceholderPicture(placeholderPictureInput.files[0]);
        }
        
        // Aktualisiere Profilbild-Anzeige
        await loadProfilePicture();
        
        // Schließe Modal
        closeProfileModal();
        
        alert('Profil erfolgreich gespeichert!');
    } catch (error) {
        console.error('Fehler beim Speichern des Profils:', error);
        alert('Fehler beim Speichern des Profils: ' + error.message);
    }
};

// Profilbild-Datei hochladen
async function uploadProfilePictureFile(file) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    
    let webpBlob;
    try {
        webpBlob = await convertToWebP(file);
        console.log('✅ Profilbild-Datei erfolgreich in WebP konvertiert.');
    } catch (error) {
        console.error('❌ Fehler bei der WebP-Konvertierung für Profilbild-Datei:', error);
        throw new Error('Fehler bei der Bildkonvertierung für Profilbild: ' + error.message);
    }

    const fileName = `${user.id}.webp`;
    
    // Lösche alte Profilbilder
    try {
        const existingFiles = ['jpg', 'jpeg', 'png', 'webp'];
        const filesToDelete = existingFiles.map(ext => `${user.id}.${ext}`);
        await supabaseClient.storage
            .from('veranstalter')
            .remove(filesToDelete);
    } catch (error) {
        console.log('Fehler beim Löschen alter Profilbilder:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Lade neues Bild hoch
    const { error } = await supabaseClient.storage
        .from('veranstalter')
        .upload(fileName, webpBlob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/webp'
        });
    
    if (error) {
        throw error;
    }
}

// Placeholder-Bild hochladen
async function uploadPlaceholderPicture(file) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    
    let webpBlob;
    try {
        webpBlob = await convertToWebP(file);
        console.log('✅ Placeholder-Bild erfolgreich in WebP konvertiert.');
    } catch (error) {
        console.error('❌ Fehler bei der WebP-Konvertierung für Placeholder-Bild:', error);
        throw new Error('Fehler bei der Bildkonvertierung für Placeholder: ' + error.message);
    }

    const fileName = `placeholder_${user.id}.webp`;
    
    // Lösche alte Placeholder-Bilder
    try {
        const existingFiles = ['jpg', 'jpeg', 'png', 'webp'];
        const filesToDelete = existingFiles.map(ext => `placeholder_${user.id}.${ext}`);
        await supabaseClient.storage
            .from('veranstalter')
            .remove(filesToDelete);
    } catch (error) {
        console.log('Fehler beim Löschen alter Placeholder-Bilder:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Lade neues Bild hoch
    const { error } = await supabaseClient.storage
        .from('veranstalter')
        .upload(fileName, webpBlob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/webp'
        });
    
    if (error) {
        throw error;
    }
};

// Profilbild hochladen
window.uploadProfilePicture = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('Du bist nicht angemeldet.');
        return;
    }
    
    console.log('📤 Lade Profilbild hoch für user_id:', user.id);
    
    let webpBlob;
    try {
        webpBlob = await convertToWebP(file);
        console.log('✅ Bild erfolgreich in WebP konvertiert.');
    } catch (error) {
        console.error('❌ Fehler bei der WebP-Konvertierung:', error);
        alert('Fehler bei der Bildkonvertierung: ' + error.message);
        return;
    }

    const fileName = `${user.id}.webp`; // Dateiname ist immer .webp
    
    console.log('📁 Dateiname (WebP):', fileName);
    
    // Lösche ALLE existierenden Dateien für diese user_id (unabhängig von alter Erweiterung)
    try {
        const existingFiles = ['jpg', 'jpeg', 'png', 'webp'];
        const filesToDelete = existingFiles.map(ext => `${user.id}.${ext}`);
        
        console.log('🗑️ Lösche alte Profilbilder:', filesToDelete);
        
        const { data: deleteData, error: deleteError } = await supabaseClient.storage
            .from('veranstalter')
            .remove(filesToDelete);
        
        if (deleteError) {
            console.log('ℹ️ Fehler beim Löschen alter Profilbilder:', deleteError);
        } else {
            console.log('✅ Alte Profilbilder gelöscht:', deleteData);
        }
    } catch (deleteError) {
        console.log('ℹ️ Alte Profilbilder konnten nicht gelöscht werden');
    }
    
    // Warte kurz, damit das Löschen abgeschlossen ist
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Jetzt die neue Datei hochladen
    console.log('⬆️ Lade neues Profilbild hoch:', fileName);
    const { data, error } = await supabaseClient.storage
        .from('veranstalter')
        .upload(fileName, webpBlob, { // webpBlob anstatt original "file"
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/webp' // Explizit contentType setzen
        });
    
    if (error) {
        console.error('❌ Fehler beim Profilbild-Upload:', error);
        
        if (error.message && (error.message.includes('row-level security') || error.message.includes('RLS'))) {
            alert('❌ Fehler: Storage RLS Policy blockiert den Upload.\n\n' +
                  'Bitte konfiguriere die Storage Policies in Supabase.');
        } else {
            alert('Fehler beim Profilbild-Upload: ' + error.message);
        }
        return;
    }
    
    console.log('✅ Profilbild erfolgreich hochgeladen:', data);
    
    // Profilbild sofort aktualisieren
    const profilePicture = document.getElementById('profile-picture');
    if (profilePicture) {
        // Entferne no-image Klasse
        profilePicture.classList.remove('no-image');
        
        // Setze neues Bild mit Cache-Busting
        const timestamp = new Date().getTime();
        const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/veranstalter/`;
        profilePicture.src = `${baseUrl}${fileName}?t=${timestamp}`;
        
        // Stelle sicher, dass es sichtbar ist
        profilePicture.style.display = 'block';
    }
    
    // Input zurücksetzen, damit derselbe Dateiname erneut ausgewählt werden kann
    event.target.value = '';
};

// Placeholder-Bild als Card-Bild verwenden
async function usePlaceholderAsCardImage(cardId, userId) {
    if (!cardId || !userId) return null;
    
    console.log('🔄 Verwende Placeholder-Bild als Card-Bild für card_id:', cardId);
    
    let placeholderFile = null;
    const placeholderFileName = `placeholder_${userId}.webp`; // Direkt webp herunterladen
    
    try {
        const { data, error } = await supabaseClient.storage
            .from('veranstalter')
            .download(placeholderFileName);
        
        if (!error && data) {
            placeholderFile = data;
            console.log('✅ Placeholder-Bild gefunden:', placeholderFileName);
        }
    } catch (err) {
        console.log('⚠️ Fehler beim Herunterladen des WebP Placeholder-Bilds:', err);
    }
    
    if (!placeholderFile) {
        console.log('⚠️ Kein Placeholder-Bild gefunden');
        return null;
    }
    
    // Immer als .webp speichern, unabhängig vom gefundenen Format
    const cardFileName = `${cardId}.webp`;
    
    // Lösche alte Card-Bilder
    try {
        const existingFiles = ['jpg', 'jpeg', 'png', 'webp'];
        const filesToDelete = existingFiles.map(ext => `${cardId}.${ext}`);
        await supabaseClient.storage
            .from('Card_images')
            .remove(filesToDelete);
    } catch (error) {
        console.log('ℹ️ Fehler beim Löschen alter Card-Bilder:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Lade Placeholder-Bild als Card-Bild hoch
    const { data, error } = await supabaseClient.storage
        .from('Card_images')
        .upload(cardFileName, placeholderFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/webp' // Explizit contentType setzen
        });
    
    if (error) {
        console.error('❌ Fehler beim Hochladen des Placeholder-Bilds als Card-Bild:', error);
        return null;
    }
    
    console.log('✅ Placeholder-Bild erfolgreich als Card-Bild hochgeladen:', data);
    return data.path;
}

// Bild in Supabase Storage hochladen
async function uploadCardImage(cardId, file) {
    if (!file) return null;
    
    console.log('📤 Lade Bild hoch für card_id:', cardId);

    let webpBlob;
    try {
        webpBlob = await convertToWebP(file);
        console.log('✅ Bild erfolgreich in WebP konvertiert für Card-Upload.');
    } catch (error) {
        console.error('❌ Fehler bei der WebP-Konvertierung für Card-Bild:', error);
        alert('Fehler bei der Bildkonvertierung für Card: ' + error.message);
        return null;
    }
    
    const fileName = `${cardId}.webp`; // Dateiname ist immer .webp
    
    console.log('📁 Dateiname (WebP):', fileName);
    
    // Lösche ALLE existierenden Dateien für diese card_id (unabhängig von der Erweiterung)
    // Dies stellt sicher, dass beim Update die alte Datei wirklich ersetzt wird
    try {
        const existingFiles = ['jpg', 'jpeg', 'png', 'webp'];
        const filesToDelete = existingFiles.map(ext => `${cardId}.${ext}`);
        
        console.log('🗑️ Lösche alte Dateien:', filesToDelete);
        
        const { data: deleteData, error: deleteError } = await supabaseClient.storage
            .from('Card_images')
            .remove(filesToDelete);
        
        if (deleteError) {
            console.log('ℹ️ Fehler beim Löschen alter Dateien (kann normal sein wenn keine existieren):', deleteError);
        } else {
            console.log('✅ Alte Dateien gelöscht:', deleteData);
        }
    } catch (deleteError) {
        // Ignoriere Fehler beim Löschen (Dateien existieren möglicherweise nicht)
        console.log('ℹ️ Alte Dateien konnten nicht gelöscht werden (normal wenn keine existieren)');
    }
    
    // Warte kurz, damit das Löschen abgeschlossen ist
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Jetzt die neue Datei hochladen
    console.log('⬆️ Lade neue Datei hoch:', fileName);
    const { data, error } = await supabaseClient.storage
        .from('Card_images')
        .upload(fileName, webpBlob, { // webpBlob anstatt original "file"
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/webp' // Explizit contentType setzen
        });
    
    if (error) {
        console.error('❌ Fehler beim Bild-Upload:', error);
        console.error('💡 Fehler-Details:', {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error
        });
        
        // Spezifische Fehlermeldung für RLS
        if (error.message && (error.message.includes('row-level security') || error.message.includes('RLS'))) {
            alert('❌ Fehler: Storage RLS Policy blockiert den Upload.\n\n' +
                  'Bitte konfiguriere die Storage Policies in Supabase:\n\n' +
                  '1. Gehe zu Storage → Card_images → Policies\n' +
                  '2. Erstelle eine INSERT Policy:\n' +
                  '   - Policy Name: "Allow authenticated uploads"\n' +
                  '   - Allowed Operation: INSERT\n' +
                  '   - Policy Definition: (bucket_id = \'Card_images\'::text) AND (auth.role() = \'authenticated\'::text)\n' +
                  '3. Erstelle eine UPDATE Policy für Upsert\n' +
                  '4. Erstelle eine SELECT Policy für öffentlichen Zugriff');
        } else {
            alert('Fehler beim Bild-Upload: ' + error.message);
        }
        return null;
    }
    
    console.log('✅ Bild erfolgreich hochgeladen:', data);
    
    // Cache-Busting: Füge Timestamp zur URL hinzu, damit das neue Bild sofort angezeigt wird
    // Dies wird in der getCardImageUrl Funktion nicht benötigt, da wir die Datei ersetzen
    return data.path;
}

// Neue Card Formular anzeigen
window.showNewCardForm = function(e) {
    if (!isveranstalter) { // Nur anzeigen, wenn Benutzer ein Veranstalter ist
        console.log('Zugriff verweigert: Nur Veranstalter können neue Cards erstellen.');
        return;
    }

    // Verhindere Event-Propagation wenn von onclick aufgerufen
    if (e) {
        e.stopPropagation();
    }
    
    // Setze Flag, damit das Formular angezeigt wird
    showNewCardFormFlag = true;
    
    // Erneut rendern, damit das Formular für die neue Card angezeigt wird
    loadCards(); 
};

// Neue Card abbrechen
window.cancelNewCard = function() {
    showNewCardFormFlag = false;
    loadCards();
};

// Neue Card speichern
window.saveNewCard = async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const title = form.querySelector('.card-input-title').value.trim();
    const description = form.querySelector('.card-input-description').value.trim(); // Changed to input
    const nfcId = form.querySelector('.card-input-nfc').value.trim();
    const unlockedAt = form.querySelector('.card-input-date').value;
    const imageFile = form.querySelector('.card-input-image').files[0];
    const cardAddress = form.querySelector('.card-input-address').value.trim();
    const cardPrice = form.querySelector('.card-input-price').value;
    const cardTimeStart = form.querySelector('.card-input-time-start').value;
    const cardTimeEnd = form.querySelector('.card-input-time-end').value;
    
    if (!title || !description || !nfcId || !unlockedAt) {
        alert('Bitte fülle alle Felder aus.');
        return;
    }
    
    const unlockedAtISO = new Date(unlockedAt).toISOString();
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const cardData = {
        card_title: title,
        card_motto: description,
        card_nfc_id: nfcId,
        unlocked_at: unlockedAtISO,
        xp_grant: 25, // Set automatically
        card_adress: cardAddress,
        card_price: parseFloat(cardPrice),
        card_time_start: cardTimeStart,
        card_time_end: cardTimeEnd,
    };
    
    if (user) {
        cardData.created_by = user.id;
    }
    
    // Zuerst Card erstellen
    const { data: newCard, error: insertError } = await supabaseClient
        .from('cards')
        .insert([cardData])
        .select()
        .single();
    
    if (insertError) {
        alert('Fehler beim Hinzufügen: ' + insertError.message);
        return;
    }
    
    // User XP um 25 erhöhen nach erfolgreichem Erstellen einer Card
    if (user) {
        try {
            // Hole aktuellen user_xp Wert
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('user_xp')
                .eq('user_id', user.id)
                .single();
            
            if (!userError && userData) {
                const currentXp = userData.user_xp || 0;
                const newXp = currentXp + 25;
                
                // Update user_xp
                const { error: updateError } = await supabaseClient
                    .from('users')
                    .update({ user_xp: newXp })
                    .eq('user_id', user.id);
                
                if (updateError) {
                    console.error('Fehler beim Aktualisieren von user_xp:', updateError);
                } else {
                    console.log(`✅ User XP erhöht: ${currentXp} → ${newXp} (+25)`);
                }
            }
        } catch (error) {
            console.error('Fehler beim Erhöhen von user_xp:', error);
        }
    }
    
    // Dann Bild hochladen falls vorhanden, sonst Placeholder-Bild verwenden
    if (newCard) {
        if (imageFile) {
            // Benutzer hat ein Bild ausgewählt
            console.log('🖼️ Starte Bild-Upload für neue Card...');
            const uploadResult = await uploadCardImage(newCard.card_id, imageFile);
            if (uploadResult) {
                console.log('✅ Bild-Upload abgeschlossen');
            } else {
                console.log('⚠️ Bild-Upload fehlgeschlagen oder übersprungen');
            }
        } else {
            // Kein Bild ausgewählt - verwende Placeholder-Bild
            console.log('🔄 Kein Bild ausgewählt, verwende Placeholder-Bild...');
            if (user) {
                const placeholderResult = await usePlaceholderAsCardImage(newCard.card_id, user.id);
                if (placeholderResult) {
                    console.log('✅ Placeholder-Bild erfolgreich als Card-Bild verwendet');
                } else {
                    console.log('⚠️ Placeholder-Bild konnte nicht als Card-Bild verwendet werden');
                }
            }
        }
    }
    
    showNewCardFormFlag = false;
    
    // Kurze Verzögerung, damit Storage die Änderungen verarbeitet
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await loadCards();
};

// Card Inline bearbeiten
window.editCardInline = function(cardId) {
    editingCardId = parseInt(cardId);
    loadCards();
};

// Bearbeitung abbrechen
window.cancelEdit = function(cardId) {
    editingCardId = null;
    loadCards();
};

// Card Inline speichern
window.saveCardInline = async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== SAVE CARD INLINE ===');
    
    // Prüfe User-Authentifizierung
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    console.log('👤 User Check:', { user: user?.id, userError });
    
    if (!user) {
        alert('Du bist nicht angemeldet. Bitte melde dich erneut an.');
        return;
    }
    
    const form = e.target;
    const cardIdHidden = form.querySelector('.card-id-hidden');
    const cardIdFromForm = cardIdHidden ? cardIdHidden.value : null;
    
    // Hole card_id aus verschiedenen Quellen
    const cardIdFromDataAttr = form.closest('.card')?.dataset?.cardId;
    const cardIdToUse = editingCardId || cardIdFromForm || cardIdFromDataAttr;
    
    console.log('🔍 card_id Quellen:', {
        'editingCardId': editingCardId,
        'cardIdFromForm': cardIdFromForm,
        'cardIdFromDataAttr': cardIdFromDataAttr,
        'cardIdToUse': cardIdToUse
    });
    
    const title = form.querySelector('.card-input-title').value.trim();
    const description = form.querySelector('.card-input-description').value.trim(); // Changed to input
    const nfcId = form.querySelector('.card-input-nfc').value.trim();
    const unlockedAt = form.querySelector('.card-input-date').value;
    const imageFile = form.querySelector('.card-input-image')?.files[0];
    const cardAddress = form.querySelector('.card-input-address').value.trim();
    const cardPrice = form.querySelector('.card-input-price').value;
    const cardTimeStart = form.querySelector('.card-input-time-start').value;
    const cardTimeEnd = form.querySelector('.card-input-time-end').value;
    
    console.log('📝 Formular-Werte:', { title, description, nfcId, unlockedAt, 'imageFile': imageFile?.name });
    
    if (!title || !description || !nfcId || !unlockedAt) {
        alert('Bitte fülle alle Felder aus.');
        return;
    }
    
    if (!cardIdToUse) {
        console.error('❌ Keine card_id gefunden!');
        alert('Fehler: Card-ID nicht gefunden. Bitte lade die Seite neu.');
        return;
    }
    
    const unlockedAtISO = new Date(unlockedAt).toISOString();
    console.log('📅 Datum konvertiert:', { unlockedAt, unlockedAtISO });
    
    // Konvertiere card_id
    let cardIdNum = typeof cardIdToUse === 'number' ? cardIdToUse : parseInt(cardIdToUse);
    
    if (isNaN(cardIdNum)) {
        console.error('❌ Ungültige card_id:', cardIdToUse);
        alert('Ungültige Card-ID');
        return;
    }
    
    console.log('🔄 card_id für Update:', cardIdNum, 'Type:', typeof cardIdNum);
    
    // Prüfe zuerst ob die Card existiert und ob wir UPDATE-Rechte haben
    const { data: checkData, error: checkError } = await supabaseClient
        .from('cards')
        .select('card_id, card_title')
        .eq('card_id', cardIdNum)
        .single();
    
    console.log('🔍 Existenz-Prüfung:', { 
        checkData, 
        checkError,
        'checkData?.card_id': checkData?.card_id,
        'checkData?.card_id Type': typeof checkData?.card_id
    });
    
    if (checkError || !checkData) {
        console.error('❌ Card nicht gefunden:', checkError);
        alert('Card wurde nicht gefunden. Fehler: ' + (checkError?.message || 'Unbekannt'));
        return;
    }
    
    // Verwende die card_id direkt aus der DB
    const actualCardId = checkData.card_id;
    console.log('✅ Card gefunden:', {
        'actualCardId': actualCardId,
        'actualCardId Type': typeof actualCardId,
        'cardIdNum': cardIdNum,
        'Gleich?': actualCardId == cardIdNum,
        'Strikt gleich?': actualCardId === cardIdNum
    });
    
    const updateData = {
        card_title: title,
        card_motto: description,
        card_nfc_id: nfcId,
        unlocked_at: unlockedAtISO,
        xp_grant: 25, // Set automatically
        card_adress: cardAddress,
        card_price: parseFloat(cardPrice),
        card_time_start: cardTimeStart,
        card_time_end: cardTimeEnd,
    };
    
    console.log('📤 Update-Daten:', updateData);
    console.log('🔑 Filter: .eq("card_id", ' + actualCardId + ') [Type: ' + typeof actualCardId + ']');
    
    // Versuche Update mit actualCardId
    console.log('🚀 Starte Update-Query...');
    let { data, error } = await supabaseClient
        .from('cards')
        .update(updateData)
        .eq('card_id', actualCardId)
        .select();
    
    console.log('📥 Update Response (actualCardId):', {
        data,
        error,
        'data?.length': data?.length,
        'error?.code': error?.code,
        'error?.message': error?.message,
        'error?.details': error?.details
    });
    
    // Falls leer, versuche mit cardIdNum
    if ((!data || data.length === 0) && !error && actualCardId != cardIdNum) {
        console.log('⚠️ Update mit actualCardId gab leeres Array, versuche mit cardIdNum...');
        const retry = await supabaseClient
            .from('cards')
            .update(updateData)
            .eq('card_id', cardIdNum)
            .select();
        data = retry.data;
        error = retry.error;
        console.log('📥 Retry Response (cardIdNum):', { data, error });
    }
    
    // Falls immer noch leer, versuche als String
    if ((!data || data.length === 0) && !error) {
        console.log('⚠️ Update mit Number gab leeres Array, versuche als String...');
        const retry = await supabaseClient
            .from('cards')
            .update(updateData)
            .eq('card_id', String(actualCardId))
            .select();
        data = retry.data;
        error = retry.error;
        console.log('📥 Retry Response (String):', { data, error });
    }
    
    if (error) {
        console.error('❌ UPDATE FEHLER:', {
            error,
            'Full Error': JSON.stringify(error, null, 2)
        });
        alert('Fehler beim Aktualisieren: ' + error.message + (error.details ? ' (' + error.details + ')' : ''));
        return;
    }
    
    if (!data || data.length === 0) {
        console.error('❌ Keine Daten zurückgegeben - möglicherweise RLS Problem');
        console.log('💡 Tipp: Prüfe die RLS Policies in Supabase für UPDATE auf der cards Tabelle');
        
        // Prüfe ob wir überhaupt UPDATE-Rechte haben
        const { data: testUpdate, error: testError } = await supabaseClient
            .from('cards')
            .update({ card_title: 'TEST' })
            .eq('card_id', actualCardId)
            .select();
        
        console.log('🧪 Test Update:', { testUpdate, testError });
        
        alert('Card wurde nicht aktualisiert. Möglicherweise blockieren RLS Policies das Update. Bitte prüfe die Console für Details.');
        return;
    }
    
    console.log('✅ Card erfolgreich aktualisiert:', data[0]);
    
    // Bild hochladen falls vorhanden
    if (imageFile && data[0]) {
        console.log('🖼️ Starte Bild-Upload...');
        const uploadResult = await uploadCardImage(data[0].card_id, imageFile);
        if (uploadResult) {
            console.log('✅ Bild-Upload abgeschlossen');
        } else {
            console.log('⚠️ Bild-Upload fehlgeschlagen oder übersprungen');
        }
    }
    
    editingCardId = null;
    
    // Kurze Verzögerung, damit Storage die Änderungen verarbeitet
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await loadCards();
    console.log('=== SAVE CARD INLINE BEENDET ===');
};

// Card löschen
window.deleteCard = async function(cardId) {
    if (!confirm('Möchtest du diese Card wirklich löschen?')) {
        return;
    }

    // Zuerst versuchen, das zugehörige Bild zu löschen
    try {
        const fileName = `${cardId}.webp`;
        console.log(`🗑️ Versuche Bild '${fileName}' für Card '${cardId}' zu löschen.`);
        const { error: storageError } = await supabaseClient.storage
            .from('Card_images')
            .remove([fileName]);

        if (storageError && storageError.statusCode !== '404') { // Ignore 404 errors (file not found)
            console.warn(`⚠️ Fehler beim Löschen des Bildes für Card '${cardId}':`, storageError.message);
            // Optional: alert('Fehler beim Löschen des Bildes: ' + storageError.message);
        } else if (storageError && storageError.statusCode === '404') {
            console.log(`ℹ️ Bild '${fileName}' für Card '${cardId}' nicht gefunden (möglicherweise bereits gelöscht oder nie hochgeladen).`);
        } else {
            console.log(`✅ Bild '${fileName}' für Card '${cardId}' erfolgreich gelöscht.`);
        }
    } catch (e) {
        console.error(`❌ Unerwarteter Fehler beim Löschen des Bildes für Card '${cardId}':`, e);
        // Auch hier die Datenbanklöschung nicht blockieren
    }
    
    const { error } = await supabaseClient
        .from('cards')
        .delete()
        .eq('card_id', parseInt(cardId));
    
    if (error) {
        alert('Fehler beim Löschen: ' + error.message);
        return;
    }
    
    if (editingCardId === parseInt(cardId)) {
        editingCardId = null;
    }
    
    loadCards();
};

// Real-time Updates für Cards
supabaseClient
    .channel('cards-changes')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cards' },
        () => {
            loadCards();
        }
    )
    .subscribe();

// Initiale Prüfung beim Laden der Seite
checkAuth();


// Preset-Funktionen
window.savePreset = async function(button) {
    const form = button.closest('.card-form-inline');
    const presetName = prompt('Bitte gib einen Namen f�r das Preset ein:');
    if (!presetName) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert('Du bist nicht angemeldet.');
        return;
    }

    const presetData = {
        created_by: user.id,
        preset_name: presetName,
        card_title: form.querySelector('.card-input-title').value,
        card_motto: form.querySelector('.card-input-description').value,
        card_nfc_id: form.querySelector('.card-input-nfc').value,
        unlocked_at: form.querySelector('.card-input-date').value ? new Date(form.querySelector('.card-input-date').value).toISOString() : null,
        card_adress: form.querySelector('.card-input-address').value,
        card_price: parseFloat(form.querySelector('.card-input-price').value),
        card_time_start: form.querySelector('.card-input-time-start').value,
        card_time_end: form.querySelector('.card-input-time-end').value,
    };

    const { error } = await supabaseClient
        .from('presets')
        .insert([presetData]);

    if (error) {
        alert('Fehler beim Speichern des Presets: ' + error.message);
    } else {
        alert('Preset erfolgreich gespeichert!');
    }
}

window.showPresetSelection = async function(button) {
    const presetSelection = button.closest('.card-form-inline').querySelector('.preset-selection');
    presetSelection.classList.toggle('hidden');
    
    if (presetSelection.classList.contains('hidden')) {
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: presets, error } = await supabaseClient
        .from('presets')
        .select('*')
        .eq('created_by', user.id);

    if (error) {
        alert('Fehler beim Laden der Presets: ' + error.message);
        return;
    }

    if (presets.length === 0) {
        presetSelection.innerHTML = '<p>Keine Presets gefunden.</p>';
        return;
    }

    const select = document.createElement('select');
    select.innerHTML = '<option value="">-- W�hle ein Preset --</option>';
    presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.preset_id;
        option.textContent = preset.preset_name;
        select.appendChild(option);
    });

    select.onchange = async (e) => {
        const presetId = e.target.value;
        if (!presetId) return;

        const { data: selectedPreset, error } = await supabaseClient
            .from('presets')
            .select('*')
            .eq('preset_id', presetId)
            .single();
        
        if (error) {
            alert('Fehler beim Laden des Presets: ' + error.message);
            return;
        }

        const form = button.closest('.card-form-inline');
        form.querySelector('.card-input-title').value = selectedPreset.card_title || '';
        form.querySelector('.card-input-description').value = selectedPreset.card_motto || '';
        form.querySelector('.card-input-nfc').value = selectedPreset.card_nfc_id || '';
        form.querySelector('.card-input-date').value = formatDateForInput(selectedPreset.unlocked_at);
        form.querySelector('.card-input-address').value = selectedPreset.card_adress || '';
        form.querySelector('.card-input-price').value = selectedPreset.card_price || '';
        form.querySelector('.card-input-time-start').value = selectedPreset.card_time_start || '';
        form.querySelector('.card-input-time-end').value = selectedPreset.card_time_end || '';
        
        presetSelection.classList.add('hidden');
    };

    presetSelection.innerHTML = '';
    presetSelection.appendChild(select);
}
