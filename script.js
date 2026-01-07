* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 2rem;
}

.container {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    text-align: center;
    min-width: 300px;
}

.hidden {
    display: none;
}

h1 {
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 2rem;
}

#angemeldet-text {
    font-size: 3rem;
    color: #667eea;
    font-weight: 600;
    margin: 2rem 0;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

input {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 5px;
    font-size: 1rem;
    transition: border-color 0.3s;
}

input:focus {
    outline: none;
    border-color: #667eea;
}

button {
    padding: 0.75rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
    font-weight: 600;
}

button:hover:not(:disabled) {
    background: #5568d3;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

#logout-btn {
    margin-top: 1rem;
    background: #e74c3c;
}

#logout-btn:hover {
    background: #c0392b;
}

.error {
    color: #e74c3c;
    margin-top: 1rem;
    font-size: 0.9rem;
    min-height: 1.5rem;
}

/* Logged In Container */
#logged-in-container {
    max-width: 1200px;
    margin: 0 auto;
}

.header {
    background: white;
    padding: 1.5rem 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.header h1 {
    margin: 0;
    font-size: 2rem;
    color: #333;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* Profilbild */
.profile-picture-container {
    position: relative;
}

.profile-picture {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
    border: 3px solid #667eea;
    transition: all 0.3s;
    background: #667eea;
    display: block;
}

.profile-picture:hover {
    background: #5568d3;
    border-color: #5568d3;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.profile-picture.no-image {
    background: #667eea;
    border: 3px solid #667eea;
}

.profile-picture.no-image:hover {
    background: #5568d3;
    border-color: #5568d3;
}

/* Form Container */
.form-container {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    margin-bottom: 2rem;
}

.form-container h2 {
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
}

textarea {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 5px;
    font-size: 1rem;
    transition: border-color 0.3s;
    font-family: inherit;
    resize: vertical;
    width: 100%;
}

textarea:focus {
    outline: none;
    border-color: #667eea;
}

.form-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

#cancel-btn {
    background: #95a5a6;
}

#cancel-btn:hover {
    background: #7f8c8d;
}

/* Cards Grid */
.cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
}

.card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s, box-shadow 0.3s;
    display: flex;
    flex-direction: column;
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

.card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.75rem;
    word-wrap: break-word;
}

.card-description {
    color: #666;
    margin-bottom: 1rem;
    flex-grow: 1;
    word-wrap: break-word;
}

.card-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e0e0e0;
}

.card-meta small {
    color: #888;
    font-size: 0.85rem;
}

.card-meta strong {
    color: #555;
}

.card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
}

.card-btn {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.9rem;
}

.card-btn.edit {
    background: #3498db;
}

.card-btn.edit:hover {
    background: #2980b9;
}

.card-btn.delete {
    background: #e74c3c;
}

.card-btn.delete:hover {
    background: #c0392b;
}

.card-btn.save {
    background: #27ae60;
}

.card-btn.save:hover {
    background: #229954;
}

.card-btn.cancel {
    background: #95a5a6;
}

.card-btn.cancel:hover {
    background: #7f8c8d;
}

/* Neue Card (Plus-Card) */
.card.new-card {
    background: #f5f5f5;
    border: 2px dashed #ccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    opacity: 0.7;
    transition: all 0.3s;
}

.card.new-card:hover:not(.editing) {
    opacity: 1;
    background: #e8e8e8;
    border-color: #667eea;
    transform: translateY(-5px);
}

.card.new-card.editing {
    cursor: default;
    opacity: 1;
    pointer-events: auto;
}

/* Vergangene Cards - Hintergrund mit 20% Alpha, aber Buttons bleiben 100% */
.card.past-card {
    background: rgba(255, 255, 255, 0.4);
    transition: background 0.3s;
}

.card.past-card:hover {
    background: rgba(255, 255, 255, 0.5);
}

.card.past-card.editing {
    background: #f9f9f9 !important;
}

.new-card-content {
    text-align: center;
    color: #999;
    cursor: pointer;
    pointer-events: auto;
}

.card.editing .new-card-content {
    display: none;
}

.plus-icon {
    font-size: 4rem;
    font-weight: 300;
    line-height: 1;
    margin-bottom: 0.5rem;
    color: #667eea;
}

.new-card-text {
    font-size: 1.1rem;
    font-weight: 500;
    color: #666;
}

/* Card im Edit-Modus */
.card.editing {
    background: #f9f9f9;
    border: 2px solid #667eea;
}

.card-form-inline {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    pointer-events: auto;
}

.card-input-title,
.card-input-description,
.card-input-nfc,
.card-input-date,
.card-input-xp,
.card-input-address,
.card-input-price,
.card-input-time-start,
.card-input-time-end {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 5px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.3s;
    width: 100%;
    pointer-events: auto;
    background: white;
}

.card-input-title:focus,
.card-input-description:focus,
.card-input-nfc:focus,
.card-input-date:focus,
.card-input-xp:focus,
.card-input-address:focus,
.card-input-price:focus,
.card-input-time-start:focus,
.card-input-time-end:focus {
    outline: none;
    border-color: #667eea;
}

.card-form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.card-form-actions .card-btn {
    flex: 1;
    padding: 0.6rem;
    font-size: 0.9rem;
}

/* Card Bild */
.card-image-container {
    width: 100%;
    height: 200px;
    margin-bottom: 1rem;
    border-radius: 8px;
    overflow: hidden;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Bild Upload */
.card-image-upload-container {
    width: 100%;
    margin-bottom: 0.75rem;
}

.card-image-label {
    display: block;
    width: 100%;
    cursor: pointer;
    position: relative;
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    background: #f9f9f9;
    transition: all 0.3s;
}

.card-image-label:hover {
    border-color: #667eea;
    background: #f0f0f0;
}

.card-image-preview {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 5px;
    margin-bottom: 0.5rem;
}

.card-input-image {
    display: none;
}

.card-image-upload-text {
    display: block;
    color: #666;
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

/* Modal */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    cursor: pointer;
}

.modal-content {
    cursor: default;
}

.modal.hidden {
    display: none;
}

.modal-content {
    background: white;
    border-radius: 10px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e0e0e0;
}

.modal-header h2 {
    margin: 0;
    color: #333;
    font-size: 1.5rem;
}

.modal-close {
    background: none;
    border: none;
    font-size: 2rem;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.3s;
}

.modal-close:hover {
    color: #333;
}

.form-group {
   /*  margin-bottom: 1.5rem; */
}

.form-group label {
    display: block;
  /*   margin-bottom: 0.5rem; */
    color: #333;
    font-weight: 600;
    font-size: 0.9rem;
}

.form-group input[type="text"] {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 5px;
    font-size: 1rem;
    transition: border-color 0.3s;
}

.form-group input[type="text"]:focus {
    outline: none;
    border-color: #667eea;
}

.image-upload-container {
    width: 100%;
}

.image-preview {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    border: 2px solid #e0e0e0;
}

.image-upload-label {
    display: block;
    width: 100%;
    cursor: pointer;
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    background: #f9f9f9;
    transition: all 0.3s;
}

.image-upload-label:hover {
    border-color: #667eea;
    background: #f0f0f0;
}

.image-upload-label input[type="file"] {
    display: none;
}

.image-upload-text {
    display: block;
    color: #666;
    font-size: 0.9rem;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 2px solid #e0e0e0;
}

.btn-primary {
    flex: 1;
    padding: 0.75rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
    font-weight: 600;
}

.btn-primary:hover {
    background: #5568d3;
}

.btn-secondary {
    flex: 1;
    padding: 0.75rem;
    background: #95a5a6;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
    font-weight: 600;
}

.btn-secondary:hover {
    background: #7f8c8d;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: left;
}

.form-group label {
    font-weight: 600;
    font-size: 0.9rem;
    color: #333;
}

.time-inputs {
    display: flex;
    gap: 1rem;
}

.time-inputs .form-group {
    flex: 1;
}

/* Responsive */
@media (max-width: 968px) {
    .cards-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 640px) {
    .cards-grid {
        grid-template-columns: 1fr;
    }
    
    .header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .modal-content {
        width: 95%;
        padding: 1.5rem;
    }
}


/* Preset Actions */
.preset-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.preset-actions .card-btn {
    flex: 0 1 auto;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
}

.preset-selection {
    margin-bottom: 1rem;
}

.preset-selection select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 5px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.3s;
    background: white;
}

/* Permission Message Styling */
#permission-message {
    position: fixed; /* Oder absolute, je nach gewünschtem Verhalten */
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 600px;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    text-align: center;
    font-size: 2.2rem; /* Groß */
    font-weight: 700;
    color: #e74c3c; /* Rote Farbe für Fehler/Zugriff verweigert */
    z-index: 1001; /* Sicherstellen, dass es über allem anderen liegt */
    line-height: 1.4;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}
