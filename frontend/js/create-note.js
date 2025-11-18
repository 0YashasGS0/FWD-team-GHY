// ===== CREATE-NOTE.JS - Handle note creation and encryption =====

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('createNoteForm');
    const noteContent = document.getElementById('noteContent');
    const charCount = document.getElementById('charCount');
    const linkResult = document.getElementById('linkResult');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const createAnotherBtn = document.getElementById('createAnotherBtn');

    // Character counter
    noteContent.addEventListener('input', function() {
        charCount.textContent = noteContent.value.length;
    });

    // Form submission - Encrypt and generate link
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Encrypting...';

            // Get form data
            const noteText = noteContent.value.trim();
            const recipientEmail = document.getElementById('recipientEmail').value.trim();
            const expiryMinutes = parseInt(document.getElementById('expiryTime').value);
            const attemptLimit = parseInt(document.getElementById('attemptLimit').value);
            const viewOnce = document.getElementById('viewOnce').checked;

            if (!noteText) {
                throw new Error('Please enter a message');
            }

            // Generate encryption key
            const encryptionKey = await generateEncryptionKey();

            // Encrypt the note
            const { ciphertext, iv } = await encryptText(noteText, encryptionKey);

            // Export key to base64 for URL
            const keyBase64 = await exportKey(encryptionKey);

            // Generate unique note ID (in production, this comes from server)
            const noteId = generateNoteId();

            // Prepare note metadata (this goes to server)
            const noteMetadata = {
                noteId: noteId,
                encryptedContent: ciphertext,
                iv: iv,
                recipientEmail: recipientEmail || null,
                expiryMinutes: expiryMinutes,
                attemptLimit: attemptLimit,
                viewOnce: viewOnce,
                createdAt: new Date().toISOString()
            };

            console.log('📦 Note metadata (to be sent to server):', noteMetadata);
            console.log('🔑 Encryption key (stays in URL fragment):', keyBase64);

            // Simulate server response (in production, send to API)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Generate shareable link
            // Key is in URL fragment (#) so it never goes to server
            const shareLink = `${window.location.origin}/frontend/view-note.html?id=${noteId}#key=${keyBase64}`;

            // Display result
            displayGeneratedLink(shareLink, expiryMinutes, viewOnce);

            // Hide form, show result
            form.style.display = 'none';
            linkResult.style.display = 'block';

            showToast('✅ Note encrypted successfully!', 'success');

        } catch (error) {
            console.error('Error creating note:', error);
            showToast('❌ Failed to create note: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // Copy link button
    copyLinkBtn.addEventListener('click', function() {
        const linkInput = document.getElementById('generatedLink');
        linkInput.select();
        document.execCommand('copy');
        
        // Visual feedback
        copyLinkBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = '📋 Copy';
        }, 2000);

        showToast('Link copied to clipboard!', 'success');
    });

    // Create another note button
    createAnotherBtn.addEventListener('click', function() {
        // Reset form
        form.reset();
        charCount.textContent = '0';
        form.style.display = 'block';
        linkResult.style.display = 'none';
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">🔐</span> Encrypt & Generate Link';
    });
});

/**
 * Display generated link with details
 */
function displayGeneratedLink(link, expiryMinutes, viewOnce) {
    document.getElementById('generatedLink').value = link;
    
    // Calculate expiry time
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const expiryDisplay = formatExpiryTime(expiryMinutes, expiryDate);
    document.getElementById('expiryDisplay').textContent = expiryDisplay;
    
    // View once status
    document.getElementById('viewOnceDisplay').textContent = viewOnce ? 'Yes ⚠️' : 'No';
}

/**
 * Format expiry time for display
 */
function formatExpiryTime(minutes, date) {
    if (minutes < 60) {
        return `${minutes} minutes (${date.toLocaleTimeString()})`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} (${date.toLocaleString()})`;
    } else {
        const days = Math.floor(minutes / 1440);
        return `${days} day${days > 1 ? 's' : ''} (${date.toLocaleDateString()})`;
    }
}

/**
 * Generate random note ID
 * (In production, this is generated by server)
 */
function generateNoteId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}
