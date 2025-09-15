// ===== GLOBAL VARIABLES =====
let gameSettings = {
    operations: ['addition'],
    denominatorRange: '1-5',
    questionType: 'missing-result'
};

let gameState = {
    currentProblem: null,
    startTime: null,
    streak: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    isGameActive: false
};

// ===== UTILITY FUNCTIONS =====

// Greatest Common Divisor
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

// Reduce fraction to simplest form
function reduceFraction(numerator, denominator) {
    const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
    return {
        numerator: numerator / divisor,
        denominator: denominator / divisor
    };
}

// Generate random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get denominator range from settings
function getDenominatorRange() {
    const ranges = {
        '1-5': [1, 5],
        '1-10': [1, 10],
        '1-12': [1, 12],
        '1-15': [1, 15]
    };
    return ranges[gameSettings.denominatorRange] || [1, 5];
}

// ===== FRACTION OPERATIONS =====

function addFractions(f1, f2) {
    const numerator = f1.numerator * f2.denominator + f2.numerator * f1.denominator;
    const denominator = f1.denominator * f2.denominator;
    return reduceFraction(numerator, denominator);
}

function subtractFractions(f1, f2) {
    const numerator = f1.numerator * f2.denominator - f2.numerator * f1.denominator;
    const denominator = f1.denominator * f2.denominator;
    return reduceFraction(numerator, denominator);
}

function multiplyFractions(f1, f2) {
    const numerator = f1.numerator * f2.numerator;
    const denominator = f1.denominator * f2.denominator;
    return reduceFraction(numerator, denominator);
}

function divideFractions(f1, f2) {
    const numerator = f1.numerator * f2.denominator;
    const denominator = f1.denominator * f2.numerator;
    return reduceFraction(numerator, denominator);
}

// ===== PROBLEM GENERATION =====

function generateFraction() {
    const [minDenom, maxDenom] = getDenominatorRange();
    const denominator = randomInt(1, maxDenom);
    const numerator = randomInt(1, denominator * 2); // Allow improper fractions
    return { numerator, denominator };
}

function generateProblem() {
    const operation = gameSettings.operations[randomInt(0, gameSettings.operations.length - 1)];
    const fraction1 = generateFraction();
    let fraction2 = generateFraction();
    
    // For subtraction, ensure we don't get negative results for beginners
    if (operation === 'subtraction') {
        const result1 = fraction1.numerator / fraction1.denominator;
        const result2 = fraction2.numerator / fraction2.denominator;
        if (result2 > result1) {
            [fraction1.numerator, fraction2.numerator] = [fraction2.numerator, fraction1.numerator];
            [fraction1.denominator, fraction2.denominator] = [fraction2.denominator, fraction1.denominator];
        }
    }
    
    // Calculate correct answer
    let correctAnswer;
    switch (operation) {
        case 'addition':
            correctAnswer = addFractions(fraction1, fraction2);
            break;
        case 'subtraction':
            correctAnswer = subtractFractions(fraction1, fraction2);
            break;
        case 'multiplication':
            correctAnswer = multiplyFractions(fraction1, fraction2);
            break;
        case 'division':
            correctAnswer = divideFractions(fraction1, fraction2);
            break;
    }
    
    // Determine what to hide based on question type
    let questionType = gameSettings.questionType;
    if (questionType === 'both') {
        questionType = Math.random() < 0.5 ? 'missing-result' : 'missing-operand';
    }
    
    let hiddenElement = 'result';
    if (questionType === 'missing-operand') {
        // Randomly choose which operand to hide
        hiddenElement = Math.random() < 0.5 ? 'fraction1' : 'fraction2';
    }
    
    return {
        fraction1,
        fraction2,
        operation,
        correctAnswer,
        hiddenElement,
        questionType
    };
}

// ===== THEME MANAGEMENT =====

function initializeTheme() {
    const savedTheme = localStorage.getItem('sakura-theme') || 'day';
    document.body.className = savedTheme + '-mode';
    
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('day-mode') ? 'day' : 'night';
    const newTheme = currentTheme === 'day' ? 'night' : 'day';
    
    document.body.className = newTheme + '-mode';
    localStorage.setItem('sakura-theme', newTheme);
    
    // Add transition effect
    document.body.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 800);
}

// ===== INDEX PAGE FUNCTIONALITY =====

function initializeIndexPage() {
    updatePreview();
    
    // Add event listeners for options
    document.querySelectorAll('input[name="operations"]').forEach(input => {
        input.addEventListener('change', updatePreview);
    });
    
    document.querySelectorAll('input[name="denominator-range"]').forEach(input => {
        input.addEventListener('change', updatePreview);
    });
    
    document.querySelectorAll('input[name="question-type"]').forEach(input => {
        input.addEventListener('change', updatePreview);
    });
    
    // Launch game button
    const launchBtn = document.getElementById('launch-game');
    if (launchBtn) {
        launchBtn.addEventListener('click', launchGame);
    }
}

function updatePreview() {
    // Get selected operations
    const selectedOps = Array.from(document.querySelectorAll('input[name="operations"]:checked'))
        .map(input => input.value);
    
    const opsText = selectedOps.length > 0 ? 
        selectedOps.map(op => op.charAt(0).toUpperCase() + op.slice(1)).join(', ') : 
        'None selected';
    
    // Get selected range
    const selectedRange = document.querySelector('input[name="denominator-range"]:checked');
    const rangeText = selectedRange ? 
        selectedRange.value + ' (' + selectedRange.parentElement.querySelector('.range-desc').textContent + ')' : 
        'None selected';
    
    // Get selected question type
    const selectedType = document.querySelector('input[name="question-type"]:checked');
    const typeText = selectedType ? 
        selectedType.parentElement.querySelector('.question-name').textContent : 
        'None selected';
    
    // Update preview
    document.getElementById('preview-ops').textContent = opsText;
    document.getElementById('preview-range').textContent = rangeText;
    document.getElementById('preview-type').textContent = typeText;
}

function launchGame() {
    // Validate selections
    const selectedOps = Array.from(document.querySelectorAll('input[name="operations"]:checked'))
        .map(input => input.value);
    
    if (selectedOps.length === 0) {
        alert('Please select at least one operation! / 少なくとも一つの演算を選択してください！');
        return;
    }
    
    // Store game settings
    gameSettings.operations = selectedOps;
    gameSettings.denominatorRange = document.querySelector('input[name="denominator-range"]:checked').value;
    gameSettings.questionType = document.querySelector('input[name="question-type"]:checked').value;
    
    // Save settings and navigate to game
    localStorage.setItem('sakura-game-settings', JSON.stringify(gameSettings));
    window.location.href = 'game.html';
}

// ===== GAME PAGE FUNCTIONALITY =====

function initializeGamePage() {
    // Load game settings
    const savedSettings = localStorage.getItem('sakura-game-settings');
    if (savedSettings) {
        gameSettings = JSON.parse(savedSettings);
    }
    
    // Initialize game state
    gameState = {
        currentProblem: null,
        startTime: Date.now(),
        streak: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        isGameActive: true
    };
    
    // Start timer
    startTimer();
    
    // Generate first problem
    generateNewProblem();
    
    // Add event listeners
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', checkAnswer);
    }
    
    // Add Enter key listener for inputs
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && gameState.isGameActive) {
            checkAnswer();
        }
    });
}

function startTimer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) return;
    
    setInterval(() => {
        if (!gameState.isGameActive) return;
        
        const elapsed = Date.now() - gameState.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function generateNewProblem() {
    gameState.currentProblem = generateProblem();
    displayProblem();
    clearFeedback();
}

function displayProblem() {
    const problem = gameState.currentProblem;
    const equationContainer = document.getElementById('fraction-equation');
    const answerSection = document.getElementById('answer-section');
    
    if (!equationContainer || !answerSection) return;
    
    // Clear containers
    equationContainer.innerHTML = '';
    answerSection.innerHTML = '';
    
    // Build equation display
    const operatorSymbols = {
        'addition': '+',
        'subtraction': '−',
        'multiplication': '×',
        'division': '÷'
    };
    
    // First fraction
    if (problem.hiddenElement === 'fraction1') {
        equationContainer.appendChild(createMissingFraction());
    } else {
        equationContainer.appendChild(createFractionElement(problem.fraction1));
    }
    
    // Operator
    const operator = document.createElement('span');
    operator.className = 'operator';
    operator.textContent = operatorSymbols[problem.operation];
    equationContainer.appendChild(operator);
    
    // Second fraction
    if (problem.hiddenElement === 'fraction2') {
        equationContainer.appendChild(createMissingFraction());
    } else {
        equationContainer.appendChild(createFractionElement(problem.fraction2));
    }
    
    // Equals sign
    const equals = document.createElement('span');
    equals.className = 'equals';
    equals.textContent = '=';
    equationContainer.appendChild(equals);
    
    // Result
    if (problem.hiddenElement === 'result') {
        equationContainer.appendChild(createMissingFraction());
    } else {
        equationContainer.appendChild(createFractionElement(problem.correctAnswer));
    }
    
    // Create input section
    createInputSection();
}

function createFractionElement(fraction) {
    const fractionDiv = document.createElement('div');
    fractionDiv.className = 'fraction';
    
    const numerator = document.createElement('div');
    numerator.className = 'numerator';
    numerator.textContent = fraction.numerator;
    
    const line = document.createElement('div');
    line.className = 'fraction-line';
    
    const denominator = document.createElement('div');
    denominator.className = 'denominator';
    denominator.textContent = fraction.denominator;
    
    fractionDiv.appendChild(numerator);
    fractionDiv.appendChild(line);
    fractionDiv.appendChild(denominator);
    
    return fractionDiv;
}

function createMissingFraction() {
    const fractionDiv = document.createElement('div');
    fractionDiv.className = 'fraction missing';
    
    const question = document.createElement('div');
    question.textContent = '?';
    question.style.fontSize = '2rem';
    question.style.fontWeight = 'bold';
    
    fractionDiv.appendChild(question);
    
    return fractionDiv;
}

function createInputSection() {
    const answerSection = document.getElementById('answer-section');
    const problem = gameState.currentProblem;
    
    const label = document.createElement('div');
    label.textContent = getInputLabel();
    label.style.marginBottom = '1rem';
    label.style.fontSize = '1.1rem';
    label.style.fontWeight = '600';
    answerSection.appendChild(label);
    
    // Create fraction input
    const fractionInput = document.createElement('div');
    fractionInput.className = 'fraction-input';
    
    const numeratorInput = document.createElement('input');
    numeratorInput.type = 'number';
    numeratorInput.id = 'numerator-input';
    numeratorInput.placeholder = '?';
    
    const inputLine = document.createElement('div');
    inputLine.className = 'input-line';
    
    const denominatorInput = document.createElement('input');
    denominatorInput.type = 'number';
    denominatorInput.id = 'denominator-input';
    denominatorInput.placeholder = '?';
    
    fractionInput.appendChild(numeratorInput);
    fractionInput.appendChild(inputLine);
    fractionInput.appendChild(denominatorInput);
    
    answerSection.appendChild(fractionInput);
    
    // Focus on first input
    setTimeout(() => numeratorInput.focus(), 100);
    
    // Add tab navigation
    numeratorInput.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            denominatorInput.focus();
        }
    });
}

function getInputLabel() {
    const problem = gameState.currentProblem;
    
    switch (problem.hiddenElement) {
        case 'result':
            return 'Enter the result / 結果を入力:';
        case 'fraction1':
            return 'Enter the first fraction / 最初の分数を入力:';
        case 'fraction2':
            return 'Enter the second fraction / 二番目の分数を入力:';
        default:
            return 'Enter your answer / 答えを入力:';
    }
}

function checkAnswer() {
    const numeratorInput = document.getElementById('numerator-input');
    const denominatorInput = document.getElementById('denominator-input');
    
    if (!numeratorInput || !denominatorInput) return;
    
    const userNumerator = parseInt(numeratorInput.value);
    const userDenominator = parseInt(denominatorInput.value);
    
    // Validate input
    if (isNaN(userNumerator) || isNaN(userDenominator) || userDenominator === 0) {
        showFeedback('Please enter valid numbers! / 有効な数字を入力してください！', false);
        return;
    }
    
    // Get correct answer based on hidden element
    let correctAnswer;
    const problem = gameState.currentProblem;
    
    if (problem.hiddenElement === 'result') {
        correctAnswer = problem.correctAnswer;
    } else if (problem.hiddenElement === 'fraction1') {
        // Calculate what fraction1 should be
        correctAnswer = (problem, 'fraction1');
    } else if (problem.hiddenElement === 'fraction2') {
        // Calculate what fraction2 should be
        correctAnswer = (problem, 'fraction2');
    }
    
    // Reduce user answer to check equivalence
    const userAnswer = reduceFraction(userNumerator, userDenominator);
    
    // Check if answers are equivalent
    const isCorrect = (userAnswer.numerator === correctAnswer.numerator && 
                      userAnswer.denominator === correctAnswer.denominator);
    
    gameState.totalQuestions++;
    
    if (isCorrect) {
        gameState.correctAnswers++;
        gameState.streak++;
        showFeedback('Correct! よくできました！ 🌸', true);
        updateStats();
        
        // Generate new problem after a short delay
        setTimeout(() => {
            generateNewProblem();
        }, 1500);
        
        // Add petal burst animation
        addPetalBurstAnimation();
        
    } else {
        gameState.streak = 0;
        const correctFraction = `${correctAnswer.numerator}/${correctAnswer.denominator}`;
        showFeedback(`Incorrect. The answer is ${correctFraction} / 不正解。答えは ${correctFraction} です。`, false);
        updateStats();
        
        // Add shake animation
        addShakeAnimation();
        
        // Clear inputs for retry
        numeratorInput.value = '';
        denominatorInput.value = '';
        numeratorInput.focus();
    }
}

function calculateMissingOperand(problem, missingOperand) {
    const { fraction1, fraction2, operation, correctAnswer } = problem;
    
    if (missingOperand === 'fraction1') {
        // We need to find fraction1 such that: fraction1 [op] fraction2 = result
        switch (operation) {
            case 'addition':
                // fraction1 + fraction2 = result → fraction1 = result - fraction2
                return subtractFractions(correctAnswer, fraction2);
            case 'subtraction':
                // fraction1 - fraction2 = result → fraction1 = result + fraction2
                return addFractions(correctAnswer, fraction2);
            case 'multiplication':
                // fraction1 × fraction2 = result → fraction1 = result ÷ fraction2
                return divideFractions(correctAnswer, fraction2);
            case 'division':
                // fraction1 ÷ fraction2 = result → fraction1 = result × fraction2
                return multiplyFractions(correctAnswer, fraction2);
        }
    } else if (missingOperand === 'fraction2') {
        // We need to find fraction2 such that: fraction1 [op] fraction2 = result
        switch (operation) {
            case 'addition':
                // fraction1 + fraction2 = result → fraction2 = result - fraction1
                return subtractFractions(correctAnswer, fraction1);
            case 'subtraction':
                // fraction1 - fraction2 = result → fraction2 = fraction1 - result
                return subtractFractions(fraction1, correctAnswer);
            case 'multiplication':
                // fraction1 × fraction2 = result → fraction2 = result ÷ fraction1
                return divideFractions(correctAnswer, fraction1);
            case 'division':
                // fraction1 ÷ fraction2 = result → fraction2 = fraction1 ÷ result
                return divideFractions(fraction1, correctAnswer);
        }
    }
    
    // Fallback (should never reach here)
    return { numerator: 1, denominator: 1 };
}

function showFeedback(message, isCorrect) {
    const feedbackElement = document.getElementById('feedback');
    if (!feedbackElement) return;
    
    feedbackElement.textContent = message;
    feedbackElement.style.color = isCorrect ? '#4caf50' : '#f44336';
    
    if (document.body.classList.contains('night-mode')) {
        feedbackElement.style.color = isCorrect ? '#a8e6cf' : '#ff8a80';
    }
}

function clearFeedback() {
    const feedbackElement = document.getElementById('feedback');
    if (feedbackElement) {
        feedbackElement.textContent = '';
    }
}

function updateStats() {
    // Update streak
    const streakElement = document.getElementById('streak');
    if (streakElement) {
        streakElement.textContent = gameState.streak;
    }
    
    // Update accuracy
    const accuracyElement = document.getElementById('accuracy');
    if (accuracyElement && gameState.totalQuestions > 0) {
        const accuracy = Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100);
        accuracyElement.textContent = accuracy + '%';
    }
}

function addPetalBurstAnimation() {
    const problemContainer = document.getElementById('problem-container');
    if (!problemContainer) return;
    
    problemContainer.classList.add('petal-burst');
    problemContainer.classList.add('correct-animation');
    
    setTimeout(() => {
        problemContainer.classList.remove('petal-burst');
        problemContainer.classList.remove('correct-animation');
    }, 1000);
}

function addShakeAnimation() {
    const problemContainer = document.getElementById('problem-container');
    if (!problemContainer) return;
    
    problemContainer.classList.add('incorrect-animation');
    
    setTimeout(() => {
        problemContainer.classList.remove('incorrect-animation');
    }, 600);
}

// ===== FLOATING PETALS ANIMATION =====

function createFloatingPetals() {
    const body = document.body;
    const petalsContainer = document.querySelector('.floating-petals');
    
    if (!petalsContainer) return;
    
    // Create additional floating petals dynamically
    setInterval(() => {
        if (Math.random() < 0.7) { // 70% chance every interval
            const petal = document.createElement('div');
            petal.innerHTML = '🌸';
            petal.style.position = 'fixed';
            petal.style.fontSize = Math.random() * 0.8 + 0.8 + 'rem';
            petal.style.left = Math.random() * 100 + 'vw';
            petal.style.top = '-50px';
            petal.style.pointerEvents = 'none';
            petal.style.zIndex = '1';
            petal.style.opacity = '0';
            
            if (body.classList.contains('night-mode')) {
                petal.style.color = '#9d8df1';
                petal.style.filter = 'drop-shadow(0 0 8px rgba(157, 141, 241, 0.6))';
            } else {
                petal.style.color = '#ffb3d9';
            }
            
            const duration = Math.random() * 4000 + 6000; // 6-10 seconds
            const swayDistance = Math.random() * 60 + 30; // 30-90px sway
            const swayDirection = Math.random() < 0.5 ? 1 : -1;
            
            // Create natural falling animation with sway
            const animationName = Math.random() < 0.33 ? 'floatPetalsLeft' : 
                                 Math.random() < 0.5 ? 'floatPetalsRight' : 'floatPetals';
            
            petal.style.animation = `${animationName} ${duration}ms linear forwards`;
            
            body.appendChild(petal);
            
            // Fade in the petal
            setTimeout(() => {
                petal.style.opacity = '0.8';
                petal.style.transition = 'opacity 0.5s ease-in';
            }, 50);
            
            // Remove petal after animation
            setTimeout(() => {
                if (petal.parentNode) {
                    petal.parentNode.removeChild(petal);
                }
            }, duration + 500);
        }
    }, 1000); // Check every 1 second
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme for all pages
    initializeTheme();
    
    // Initialize floating petals animation
    createFloatingPetals();
    
    // Initialize page-specific functionality
    if (window.location.pathname.includes('game.html') || document.getElementById('problem-container')) {
        initializeGamePage();
    } else {
        initializeIndexPage();
    }
    
    // Add responsive behavior for mobile
    handleMobileOptimizations();
});

// ===== MOBILE OPTIMIZATIONS =====

function handleMobileOptimizations() {
    // Prevent zoom on input focus for mobile
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                input.style.fontSize = '16px'; // Prevents zoom on iOS
            });
        });
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            window.scrollTo(0, 0);
        }, 500);
    });
}

// ===== KEYBOARD NAVIGATION IMPROVEMENTS =====

document.addEventListener('keydown', function(e) {
    // ESC key to return to menu from game
    if (e.key === 'Escape' && window.location.pathname.includes('game.html')) {
        if (confirm('Return to main menu? / メインメニューに戻りますか？')) {
            window.location.href = 'index.html';
        }
    }
    
    // Space bar to toggle theme (when not in input)
    if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        toggleTheme();
    }
});

// ===== ENHANCED FRACTION VALIDATION =====

function validateFractionInput(numerator, denominator) {
    // Check for valid numbers
    if (isNaN(numerator) || isNaN(denominator)) {
        return { valid: false, message: 'Please enter valid numbers / 有効な数字を入力してください' };
    }
    
    // Check for zero denominator
    if (denominator === 0) {
        return { valid: false, message: 'Denominator cannot be zero / 分母は0にできません' };
    }
    
    // Check for reasonable range
    if (Math.abs(numerator) > 1000 || Math.abs(denominator) > 1000) {
        return { valid: false, message: 'Please use smaller numbers / より小さい数字を使用してください' };
    }
    
    return { valid: true };
}

// ===== ACCESSIBILITY ENHANCEMENTS =====

function announceForScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-9999px';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ===== LOCAL STORAGE MANAGEMENT =====

function saveGameProgress() {
    const progress = {
        streak: gameState.streak,
        totalQuestions: gameState.totalQuestions,
        correctAnswers: gameState.correctAnswers,
        sessionStartTime: gameState.startTime,
        lastUpdated: Date.now()
    };
    
    localStorage.setItem('sakura-game-progress', JSON.stringify(progress));
}

function loadGameProgress() {
    const savedProgress = localStorage.getItem('sakura-game-progress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        // Only load if from same session (less than 1 hour old)
        if (Date.now() - progress.lastUpdated < 3600000) {
            return progress;
        }
    }
    return null;
}

// ===== PERFORMANCE OPTIMIZATIONS =====

// Debounce function for input validation
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add input validation with debouncing
document.addEventListener('input', debounce(function(e) {
    if (e.target.type === 'number') {
        const value = parseInt(e.target.value);
        if (value && (value < -100 || value > 100)) {
            e.target.style.borderColor = '#f44336';
        } else {
            e.target.style.borderColor = '';
        }
    }
}, 300));

// ===== ADVANCED PROBLEM GENERATION =====

function generateAdvancedProblem() {
    // Generate problems with consideration for educational progression
    const problem = generateProblem();
    
    // Ensure fractions are not too complex for the selected difficulty
    const [minDenom, maxDenom] = getDenominatorRange();
    
    // Adjust complexity based on user's current streak
    if (gameState.streak > 5) {
        // Increase difficulty slightly for streaking players
        problem.fraction1.denominator = Math.min(problem.fraction1.denominator + 1, maxDenom);
    } else if (gameState.streak === 0 && gameState.totalQuestions > 3) {
        // Decrease difficulty slightly after incorrect answers
        problem.fraction1.denominator = Math.max(problem.fraction1.denominator - 1, 2);
        problem.fraction2.denominator = Math.max(problem.fraction2.denominator - 1, 2);
    }
    
    return problem;
}

// ===== ERROR HANDLING =====

window.addEventListener('error', function(e) {
    console.error('Fraction Sakura Error:', e.error);
    
    // Fallback for critical errors
    if (e.error && e.error.message.includes('generateProblem')) {
        // Reset to safe defaults
        gameSettings.operations = ['addition'];
        gameSettings.denominatorRange = '1-5';
        generateNewProblem();
    }
});

// ===== FINAL INITIALIZATION =====

// Ensure all event listeners are properly attached
document.addEventListener('DOMContentLoaded', function() {
    // Double-check critical elements exist
    setTimeout(() => {
        const criticalElements = ['theme-btn'];
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (element && !element.hasEventListener) {
                element.addEventListener('click', id === 'theme-btn' ? toggleTheme : null);
                element.hasEventListener = true;
            }
        });
    }, 100);
});

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        reduceFraction,
        addFractions,
        subtractFractions,
        multiplyFractions,
        divideFractions,
        generateFraction,
        validateFractionInput
    };
}
