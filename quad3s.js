document.addEventListener('DOMContentLoaded', () => {

    // --- Sticky Navigation ---
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    // --- Testimonials with Dot Controls ---
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    let slideTimer;

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide((currentSlide + 1) % slides.length);
    }

    function startTimer() {
        slideTimer = setInterval(nextSlide, 5000);
    }

    if (slides.length > 0) {
        startTimer();
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                clearInterval(slideTimer);
                goToSlide(i);
                startTimer();
            });
        });
    }

    // --- Mobile Menu ---
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-open');
            });
        });
    }

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isOpen = question.getAttribute('aria-expanded') === 'true';

            faqItems.forEach(other => {
                other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                other.querySelector('.faq-answer').classList.remove('open');
            });

            if (!isOpen) {
                question.setAttribute('aria-expanded', 'true');
                answer.classList.add('open');
            }
        });
    });

    // --- Application Form ---
    const form = document.getElementById('applyForm');
    if (!form) return;

    const formFields = document.getElementById('form-fields');
    const formSuccess = document.getElementById('form-success');
    const submitBtn = document.getElementById('submitBtn');
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

    function validateForm() {
        let valid = true;
        ['firstName', 'lastName', 'email', 'phone', 'course'].forEach(id => clearError(id));

        const firstName = document.getElementById('firstName').value.trim();
        const lastName  = document.getElementById('lastName').value.trim();
        const email     = document.getElementById('email').value.trim();
        const phone     = document.getElementById('phone').value.trim();
        const course    = document.getElementById('course').value;

        if (!firstName) { showError('firstName', 'First name is required.'); valid = false; }
        if (!lastName)  { showError('lastName', 'Last name is required.'); valid = false; }
        if (!email)     { showError('email', 'Email address is required.'); valid = false; }
        else if (!validateEmail(email)) { showError('email', 'Please enter a valid email address.'); valid = false; }
        if (!phone)     { showError('phone', 'Phone number is required.'); valid = false; }
        else if (!validatePhone(phone)) { showError('phone', 'Please enter a valid 10-digit phone number.'); valid = false; }
        if (!course)    { showError('course', 'Please select a course.'); valid = false; }

        return valid;
    }

    ['firstName', 'lastName', 'email', 'phone', 'course'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => clearError(id));
            el.addEventListener('blur', () => {
                if (!el.value.trim()) {
                    showError(id, el.tagName === 'SELECT' ? 'Please select an option.' : 'This field is required.');
                }
            });
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
            firstName:   document.getElementById('firstName').value.trim(),
            lastName:    document.getElementById('lastName').value.trim(),
            email:       document.getElementById('email').value.trim(),
            phone:       document.getElementById('phone').value.trim(),
            course:      document.getElementById('course').value,
            experience:  document.getElementById('experience').value || 'not specified',
            message:     document.getElementById('message').value.trim(),
            submittedAt: new Date().toISOString(),
        };

        try {
            const response = await fetch('https://formspree.io/f/xnjloypg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                formFields.style.display = 'none';
                formSuccess.classList.remove('hidden');
            } else {
                throw new Error('Submission failed');
            }
        } catch (err) {
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.style.display = 'none';
            const errMsg = document.getElementById('form-submit-error');
            if (errMsg) errMsg.style.display = 'block';
        }
    });
});
