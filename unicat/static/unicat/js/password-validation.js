class PasswordValidator {
    constructor(passwordFieldId, confirmFieldId) {
        this.passwordField = document.getElementById(passwordFieldId);
        this.confirmField = document.getElementById(confirmFieldId);
        this.submitButton = document.querySelector('.auth-submit-btn');
        this.sidebarContainer = document.querySelector('.password-validation-sidebar');
        
        this.requirements = {
            length: { test: (pwd) => pwd.length >= 8, message: "At least 8 characters" },
            uppercase: { test: (pwd) => /[A-Z]/.test(pwd), message: "At least one uppercase letter" },
            lowercase: { test: (pwd) => /[a-z]/.test(pwd), message: "At least one lowercase letter" },
            number: { test: (pwd) => /\d/.test(pwd), message: "At least one number" },
            special: { test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), message: "At least one special character" }
        };
        
        this.isVisible = false;
        this.init();
    }
    
    init() {
        this.createRequirementsDisplay();
        this.attachEventListeners();
        this.hideCompletely();
    }
    
    createRequirementsDisplay() {
        const requirementsHTML = `
            <div class="password-requirements hidden" id="password-requirements">
                <div class="password-strength">
                    <div class="strength-meter">
                        <div class="strength-fill" id="strength-fill"></div>
                    </div>
                    <div class="strength-text" id="strength-text">Password strength</div>
                </div>
                <div>
                    ${Object.keys(this.requirements).map(key => `
                        <div class="requirement" id="req-${key}">
                            <i class="fas fa-times"></i>
                            <span>${this.requirements[key].message}</span>
                        </div>
                    `).join('')}
                    <div class="requirement" id="req-match">
                        <i class="fas fa-times"></i>
                        <span>Passwords match</span>
                    </div>
                </div>
            </div>
        `;
        
        this.sidebarContainer.innerHTML = `
            <h4 class="validation-title hidden" id="validation-title" >Password Requirements</h4>
            ${requirementsHTML}
        `;
    }
    
    attachEventListeners() {
        this.passwordField.addEventListener('focus', () => this.showRequirements());
        this.confirmField.addEventListener('focus', () => this.showRequirements());
        this.passwordField.addEventListener('input', () => {
            this.showRequirements();
            this.validatePassword();
        });
        this.confirmField.addEventListener('input', () => {
            this.showRequirements();
            this.validatePassword();
        });
        
        this.passwordField.addEventListener('blur', () => {
            setTimeout(() => this.checkIfShouldHide(), 200);
        });
        this.confirmField.addEventListener('blur', () => {
            setTimeout(() => this.checkIfShouldHide(), 200);
        });
    }
    
    checkIfShouldHide() {
        const passwordEmpty = !this.passwordField.value;
        const confirmEmpty = !this.confirmField.value;
        const passwordHasFocus = document.activeElement === this.passwordField;
        const confirmHasFocus = document.activeElement === this.confirmField;
        
        if (passwordEmpty && confirmEmpty && !passwordHasFocus && !confirmHasFocus) {
            this.hideCompletely();
        }
    }
    
    showRequirements() {
        if (this.isVisible) return;
        
        const requirements = document.getElementById('password-requirements');
        const title = document.getElementById('validation-title');
        
    // Mostrar la barra lateral primer
        this.sidebarContainer.style.display = 'block';
        this.sidebarContainer.style.opacity = '0';
        this.sidebarContainer.style.transform = 'translateX(20px)';
        
    // Forçar repaint
        this.sidebarContainer.offsetHeight;
        
    // Animar la barra lateral
        this.sidebarContainer.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        this.sidebarContainer.style.opacity = '1';
        this.sidebarContainer.style.transform = 'translateX(0)';
        
    // Mostrar el títol amb retard
        setTimeout(() => {
            title.classList.remove('hidden');
            title.style.opacity = '0';
            title.style.transform = 'translateY(-10px)';
            title.style.transition = 'all 0.3s ease';
            
            // Forçar repaint
            title.offsetHeight;
            
            title.style.opacity = '1';
            title.style.transform = 'translateY(0)';
        }, 100);
        
    // Mostrar els requisits amb més retard
        setTimeout(() => {
            requirements.classList.remove('hidden');
            requirements.classList.add('entering');
            requirements.style.display = 'block';
            
            // Animar cada requisit individualment
            const allRequirements = requirements.querySelectorAll('.requirement');
            allRequirements.forEach((req, index) => {
                req.style.opacity = '0';
                req.style.transform = 'translateX(20px)';
                req.style.transition = `all 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms`;
                
                setTimeout(() => {
                    req.style.opacity = '1';
                    req.style.transform = 'translateX(0)';
                }, 50);
            });
            
            // Netejar classe d'animació
            setTimeout(() => {
                requirements.classList.remove('entering');
            }, 600);
        }, 200);
        
        this.isVisible = true;
    }
    
    hideCompletely() {
        if (!this.isVisible) return;
        
        const requirements = document.getElementById('password-requirements');
        const title = document.getElementById('validation-title');
        
    // Animar sortida dels requisits
        requirements.classList.add('leaving');
        const allRequirements = requirements.querySelectorAll('.requirement');
        allRequirements.forEach((req, index) => {
            req.style.transition = `all 0.2s ease ${index * 30}ms`;
            req.style.opacity = '0';
            req.style.transform = 'translateX(15px)';
        });
        
    // Amagar títol
        setTimeout(() => {
            title.style.transition = 'all 0.2s ease';
            title.style.opacity = '0';
            title.style.transform = 'translateY(-5px)';
        }, 150);
        
    // Amagar barra lateral
        setTimeout(() => {
            this.sidebarContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            this.sidebarContainer.style.opacity = '0';
            this.sidebarContainer.style.transform = 'translateX(15px)';
        }, 200);
        
    // Amagar completament
        setTimeout(() => {
            requirements.classList.add('hidden');
            requirements.classList.remove('leaving');
            title.classList.add('hidden');
            this.sidebarContainer.style.display = 'none';
            
            // Reset styles
            allRequirements.forEach(req => {
                req.style.opacity = '';
                req.style.transform = '';
                req.style.transition = '';
            });
            title.style.opacity = '';
            title.style.transform = '';
            this.sidebarContainer.style.opacity = '';
            this.sidebarContainer.style.transform = '';
        }, 500);
        
        this.isVisible = false;
    }
    
    validatePassword() {
        const password = this.passwordField.value;
        const confirmPassword = this.confirmField.value;
        
        let validCount = 0;
        const totalRequirements = Object.keys(this.requirements).length + 1;
        
    // Validar cada requisit amb animació retardada
        Object.keys(this.requirements).forEach((key, index) => {
            const requirement = this.requirements[key];
            const element = document.getElementById(`req-${key}`);
            const icon = element.querySelector('i');
            
            // Afegir retard basat en l'índex per efecte cascada
            setTimeout(() => {
                if (requirement.test(password)) {
                    element.classList.add('valid');
                    element.classList.remove('invalid');
                    icon.className = 'fas fa-check';
                    validCount++;
                } else {
                    element.classList.add('invalid');
                    element.classList.remove('valid');
                    icon.className = 'fas fa-times';
                }
            }, index * 50);
        });
        
    // Validar coincidència de contrasenyes
        setTimeout(() => {
            const matchElement = document.getElementById('req-match');
            const matchIcon = matchElement.querySelector('i');
            
            if (password && confirmPassword && password === confirmPassword) {
                matchElement.classList.add('valid');
                matchElement.classList.remove('invalid');
                matchIcon.className = 'fas fa-check';
                validCount++;
            } else {
                matchElement.classList.add('invalid');
                matchElement.classList.remove('valid');
                matchIcon.className = 'fas fa-times';
            }
        }, Object.keys(this.requirements).length * 50);
        
    // Actualitzar medidor de força amb retard
        setTimeout(() => {
            this.updateStrengthMeter(this.calculateValidCount(password, confirmPassword), totalRequirements);
            this.updateSubmitButton(this.calculateValidCount(password, confirmPassword) === totalRequirements);
        }, (Object.keys(this.requirements).length + 1) * 50);
    }
    
    calculateValidCount(password, confirmPassword) {
        let count = 0;
        Object.keys(this.requirements).forEach(key => {
            if (this.requirements[key].test(password)) count++;
        });
        if (password && confirmPassword && password === confirmPassword) count++;
        return count;
    }
    
    updateStrengthMeter(validCount, totalRequirements) {
        const percentage = (validCount / totalRequirements) * 100;
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');
        
    // Animació més suau de l'ample
        strengthFill.style.width = `${percentage}%`;
        
        if (percentage < 40) {
            strengthFill.className = 'strength-fill strength-weak';
            strengthText.textContent = 'Weak password';
            strengthText.style.color = '#dc3545';
        } else if (percentage < 80) {
            strengthFill.className = 'strength-fill strength-medium';
            strengthText.textContent = 'Medium password';
            strengthText.style.color = '#ffc107';
        } else {
            strengthFill.className = 'strength-fill strength-strong';
            strengthText.textContent = 'Strong password';
            strengthText.style.color = '#28a745';
        }
    }
    
    updateSubmitButton(isValid) {
    // Transició més suau per al botó
        this.submitButton.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        if (isValid) {
            this.submitButton.disabled = false;
            this.submitButton.style.opacity = '1';
            this.submitButton.style.transform = 'translateY(0)';
        } else {
            this.submitButton.disabled = true;
            this.submitButton.style.opacity = '0.6';
            this.submitButton.style.transform = 'translateY(1px)';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('password') && document.getElementById('confirmation')) {
        new PasswordValidator('password', 'confirmation');
    }
});