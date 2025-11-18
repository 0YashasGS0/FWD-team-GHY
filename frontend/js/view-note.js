// ===== VIEW-NOTE.JS - Handle note viewing and decryption =====

let noteData = null;
let destructTimer = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Parse URL to get note ID and encryption key
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');
    const urlHash = window.location.hash;
    
    // Extract key from URL fragment (#key=...)
    const keyMatch = urlHash.match(/#key=([^&]+)/);
    const encryptionKey = keyMatch ? keyMatch[1] : null;

    console.log('📄 Note ID:', noteId);
    console.log('🔑 Has encryption key:', !!encryptionKey);

    // Validate URL parameters
    if (!noteId || !encryptionKey) {
        showError('Invalid Link', 'This link is malformed or incomplete. Please check the URL and try again.');
        return;
    }

    // Fetch note metadata from server (simulated)
    try {
        await loadNoteMetadata(noteId);
        showBiometricVerification();
    } catch (error) {
        showError('Note Not Found', error.message);
    }

    // Setup biometric verification button
    document.getElementById('verifyBiometricBtn').addEventListener('click', async function() {
        try {
            await verifyAndDecrypt(encryptionKey);
        } catch (error) {
            console.error('Verification failed:', error);
            showToast('❌ ' + error.message, 'error');
            
            // Decrement attempts
            if (noteData && noteData.attemptsLeft > 0) {
                noteData.attemptsLeft--;
                updateAttemptsDisplay();
                
                if (noteData.attemptsLeft === 0) {
                    showError('Maximum Attempts Exceeded', 'You have used all available attempts to access this note.');
                }
            }
        }
    });

    // Copy note button
    document.getElementById('copyNoteBtn').addEventListener('click', function() {
        const noteText = document.getElementById('noteContent').textContent;
        navigator.clipboard.writeText(noteText);
        showToast('📋 Note copied to clipboard', 'success');
    });

    // Close note button
    document.getElementById('closeNoteBtn').addEventListener('click', function() {
        if (noteData && noteData.viewOnce) {
            startSelfDestruct();
        } else {
            showToast('✅ You can close this page', 'success');
        }
    });
});

/**
 * Load note metadata from server (simulated)
 */
async function loadNoteMetadata(noteId) {
    // Show loading state
    showState('loadingState');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulated note metadata (in production, this comes from server)
    noteData = {
        noteId: noteId,
        encryptedContent: 'U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y96Qsv2Lm+31cmzaAILwytX/0=' + Math.random(), // Fake encrypted data
        iv: 'YWJjZGVmZ2hpamts', // Fake IV
        recipientEmail: null,
        expiryTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        attemptLimit: 3,
        attemptsLeft: 3,
        viewOnce: true,
        createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    };

    // Check if expired
    if (new Date() > noteData.expiryTime) {
        throw new Error('This note has expired and is no longer available.');
    }

    // Check attempts
    if (noteData.attemptsLeft <= 0) {
        throw new Error('Maximum access attempts exceeded for this note.');
    }

    console.log('📦 Note metadata loaded:', noteData);
}

/**
 * Show biometric verification screen
 */
function showBiometricVerification() {
    showState('biometricState');
    
    // Update attempts display
    updateAttemptsDisplay();
    
    // Start expiry countdown
    startExpiryCountdown();
}

/**
 * Update attempts left display
 */
function updateAttemptsDisplay() {
    const attemptsEl = document.getElementById('attemptsLeft');
    attemptsEl.textContent = noteData.attemptsLeft;
    
    if (noteData.attemptsLeft <= 1) {
        attemptsEl.style.color = 'var(--error)';
    }
}

/**
 * Start expiry countdown timer
 */
function startExpiryCountdown() {
    const countdownEl = document.getElementById('expiryCountdown');
    
    function updateCountdown() {
        const now = new Date();
        const timeLeft = noteData.expiryTime - now;
        
        if (timeLeft <= 0) {
            countdownEl.textContent = 'Expired';
            countdownEl.style.color = 'var(--error)';
            showError('Note Expired', 'This note has expired while you were viewing it.');
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        countdownEl.textContent = `${minutes}m ${seconds}s`;
        
        setTimeout(updateCountdown, 1000);
    }
    
    updateCountdown();
}

/**
 * Verify biometrics and decrypt note
 */
async function verifyAndDecrypt(keyBase64) {
    const verifyBtn = document.getElementById('verifyBiometricBtn');
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="btn-icon">⏳</span> Verifying...';

    try {
        // Verify biometrics
        const userEmail = localStorage.getItem('biometric_user_email') || 'demo@example.com';
        await verifyBiometric(userEmail);
        
        console.log('✅ Biometric verified');
        showToast('✅ Identity verified', 'success');

        // Import encryption key
        const cryptoKey = await importKey(keyBase64);
        
        // Decrypt note (using demo data for now)
        // In production, use: await decryptText(noteData.encryptedContent, noteData.iv, cryptoKey);
        const demoPlaintext = "🔐 CONFIDENTIAL MESSAGE\n\nPassword: SuperSecret123!\nUsername: admin@company.com\n\nThis message will self-destruct after viewing.\n\n⚠️ Do not share this information.";
        
        console.log('🔓 Note decrypted successfully');
        
        // Display decrypted note
        showDecryptedNote(demoPlaintext);

    } catch (error) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<span class="btn-icon">👆</span> Verify with Biometrics';
        throw error;
    }
}

/**
 * Display decrypted note content
 */
function showDecryptedNote(plaintext) {
    showState('noteContentState');
    
    // Display note content
    document.getElementById('noteContent').textContent = plaintext;
    
    // Set viewed time
    document.getElementById('viewedTime').textContent = new Date().toLocaleString();
    
    // Set view-once status
    document.getElementById('viewOnceStatus').textContent = noteData.viewOnce ? 'Yes (Will Self-Destruct)' : 'No';
    
    // If view-once, show destruct warning after 3 seconds
    if (noteData.viewOnce) {
        setTimeout(() => {
            document.getElementById('destructCountdown').style.display = 'block';
            startSelfDestruct();
        }, 3000);
    }
}

/**
 * Start self-destruct countdown
 */
function startSelfDestruct() {
    let secondsLeft = 5;
    const timerEl = document.getElementById('destructTimer');
    const progressEl = document.getElementById('destructProgress');
    
    progressEl.style.width = '100%';
    
    destructTimer = setInterval(() => {
        secondsLeft--;
        timerEl.textContent = secondsLeft;
        progressEl.style.width = (secondsLeft / 5 * 100) + '%';
        
        if (secondsLeft <= 0) {
            clearInterval(destructTimer);
            destroyNote();
        }
    }, 1000);
}

/**
 * Destroy note and show confirmation
 */
function destroyNote() {
    console.log('💥 Note destroyed');
    
    // TODO: Send destruction confirmation to server
    
    showState('destroyedState');
    showToast('💥 Note permanently deleted', 'success');
}

/**
 * Show error state
 */
function showError(title, message) {
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    showState('errorState');
}

/**
 * Show specific state card
 */
function showState(stateId) {
    const states = ['loadingState', 'biometricState', 'noteContentState', 'errorState', 'destroyedState'];
    states.forEach(id => {
        document.getElementById(id).style.display = id === stateId ? 'block' : 'none';
    });
}
