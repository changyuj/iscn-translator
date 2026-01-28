/**
 * UI Interaction Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('karyotype-input');
    const button = document.getElementById('translate-btn');
    const resultDiv = document.getElementById('result');
    const examples = document.querySelectorAll('.example-chip');

    const handleTranslate = () => {
        const value = input.value.trim();
        const translation = translateKaryotype(value);
        
        // Show result with animation
        resultDiv.style.opacity = '0';
        setTimeout(() => {
            resultDiv.innerHTML = translation;
            resultDiv.style.opacity = '1';
        }, 150);
    };

    button.addEventListener('click', handleTranslate);

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleTranslate();
        }
    });

    examples.forEach(chip => {
        chip.addEventListener('click', () => {
            input.value = chip.dataset.karyotype;
            handleTranslate();
            // Highlight Input
            input.focus();
        });
    });
});
