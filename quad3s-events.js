document.addEventListener('DOMContentLoaded', () => {

    // --- Sticky Nav ---
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // --- Mobile Menu ---
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.style.display === 'flex';
            navLinks.style.display = isOpen ? 'none' : 'flex';
            if (isOpen) return;
            if (!isOpen) {
                Object.assign(navLinks.style, {
                    flexDirection: 'column',
                    position: 'absolute',
                    top: '70px',
                    left: '0',
                    width: '100%',
                    backgroundColor: 'rgba(10,30,20,0.98)',
                    padding: '24px 24px 32px',
                    gap: '20px',
                    backdropFilter: 'blur(12px)',
                    zIndex: '999',
                });
            }
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.style.display = 'none';
            });
        });
    }

    // --- Event Booking Form ---
    const form = document.getElementById('eventForm');
    if (!form) return;

    const formFields = document.getElementById('event-form-fields');
    const formSuccess = document.getElementById('event-form-success');
    const submitBtn = document.getElementById('evtSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    function showError(fieldId, message) {
        const input = document.getElementById(fieldId);
        const error = document.getElementById(fieldId + 'Error');
        if (input) input.classList.add('error');
        if (error) error.textContent = message;
    }

    function clearError(fieldId) {
        const input = document.getElementById(fieldId);
        const error = document.getElementById(fieldId + 'Error');
        if (input) input.classList.remove('error');
        if (error) error.textContent = '';
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePhone(phone) {
        return phone.replace(/\D/g, '').length >= 10;
    }

    const requiredFields = ['evtFirstName', 'evtLastName', 'evtEmail', 'evtPhone', 'evtType', 'evtGuests'];

    function validateForm() {
        let valid = true;
        requiredFields.forEach(id => clearError(id));

        const firstName = document.getElementById('evtFirstName').value.trim();
        const lastName  = document.getElementById('evtLastName').value.trim();
        const email     = document.getElementById('evtEmail').value.trim();
        const phone     = document.getElementById('evtPhone').value.trim();
        const type      = document.getElementById('evtType').value;
        const guests    = document.getElementById('evtGuests').value;

        if (!firstName) { showError('evtFirstName', 'First name is required.'); valid = false; }
        if (!lastName)  { showError('evtLastName', 'Last name is required.'); valid = false; }
        if (!email)     { showError('evtEmail', 'Email address is required.'); valid = false; }
        else if (!validateEmail(email)) { showError('evtEmail', 'Please enter a valid email.'); valid = false; }
        if (!phone)     { showError('evtPhone', 'Phone number is required.'); valid = false; }
        else if (!validatePhone(phone)) { showError('evtPhone', 'Please enter a valid 10-digit phone number.'); valid = false; }
        if (!type)      { showError('evtType', 'Please select an event type.'); valid = false; }
        if (!guests)    { showError('evtGuests', 'Please select a guest count.'); valid = false; }

        return valid;
    }

    requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => clearError(id));
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        btnLoading.style.display = 'inline';

        const data = {
            firstName:  document.getElementById('evtFirstName').value.trim(),
            lastName:   document.getElementById('evtLastName').value.trim(),
            email:      document.getElementById('evtEmail').value.trim(),
            phone:      document.getElementById('evtPhone').value.trim(),
            eventType:  document.getElementById('evtType').value,
            guestCount: document.getElementById('evtGuests').value,
            eventDate:  document.getElementById('evtDate').value || 'Not specified',
            games:      document.getElementById('evtGames').value || 'Not specified',
            message:    document.getElementById('evtMessage').value.trim(),
            submittedAt: new Date().toISOString(),
            formSource: 'Events Page',
        };

        try {
            // Using same Formspree endpoint - submissions tagged with formSource: 'Events Page'
            const response = await fetch('https://formspree.io/f/xnjloypg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                formFields.style.display = 'none';
                formSuccess.classList.remove('hidden');
            } else {
                throw new Error('Failed');
            }
        } catch (err) {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.style.display = 'none';
            const errMsg = document.getElementById('evt-submit-error');
            if (errMsg) errMsg.style.display = 'block';
        }
    });
});
