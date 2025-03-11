// ==UserScript==
// @name         x NO AI CAPTCHA
// @namespace    https://nocaptchaai.com/
// @version      0.6
// @description  BLSS OCR Captcha Solver
// @author       SUFYAN
// @match        ://*.ita-pak.blsinternational.com/*
// @match        *://pakistan.blsspainglobal.com/*
// @match        https://newconfig.nocaptchaai.com/*
// @updateURL    https://github.com/mrsufyanali/my-tampermonkey-scripts/raw/refs/heads/main/my-aicaptcha.user.js
// @downloadURL  https://github.com/mrsufyanali/my-tampermonkey-scripts/raw/refs/heads/main/my-aicaptcha.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';
    const apiKey = "mrsufyan-1c881fbe-c29a-0b01-8d68-63876d60ecea";
    let numberToSelect = null;
    let scriptActive = GM_getValue('scriptActive', false);

    const toggleButton = document.createElement('button');
    toggleButton.textContent = scriptActive ? 'No Captcha AI Stop' : 'No Captcha AI Start';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '150px';
    toggleButton.style.right = '20px';
    toggleButton.style.zIndex = '10000';
    toggleButton.style.padding = '10px';
    toggleButton.style.backgroundColor = scriptActive ? 'green' : 'red';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '5px';
    toggleButton.style.cursor = 'pointer';
    document.body.appendChild(toggleButton);

    function handleCaptcha() {
        if (!scriptActive) return;

        const captchaElements = document.querySelectorAll('.box-label');
        captchaElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.color === 'rgb(33, 37, 41)') {
                console.log("Correct captcha instruction found:", el);
                numberToSelect = el.innerText.match(/\d+/)[0];
                console.log("Correct captcha instruction found:", numberToSelect);
            }
        });
        if (numberToSelect) {
            let captchaImages = Array.from(document.querySelectorAll('.captcha-img')).filter(isClickable);
            captchaImages.sort((a, b) => {
                const parentDivA = a.parentElement;
                const parentStyleA = window.getComputedStyle(parentDivA);
                const zIndexA = parseInt(parentStyleA.zIndex, 10) || 0;
                const parentDivB = b.parentElement;
                const parentStyleB = window.getComputedStyle(parentDivB);
                const zIndexB = parseInt(parentStyleB.zIndex, 10) || 0;
                return zIndexB - zIndexA;
            });
            captchaImages = captchaImages.slice(0, 9);
            console.log(captchaImages);
            const imageUrls = Array.from(captchaImages).map(img => { let base64Data = img.src; let base64Raw = base64Data.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, ''); return base64Raw; });
            sendToNoCaptchaAI(imageUrls, numberToSelect, captchaImages);
        } else {
            console.log("Captcha instruction not found.");
        }
    }

    function sendToNoCaptchaAI(imageUrls, numberToSelect, captchaImages) {
        const apiEndpoint = 'https://pro.nocaptchaai.com/solve';
        console.log(JSON.stringify({
            id: "morocco",
            method: "ocr",
            images: Object.assign({}, imageUrls),
        }));
        fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "apikey": apiKey
            },
            body: JSON.stringify({
                id: "morocco",
                method: "ocr",
                images: Object.assign({}, imageUrls),
            }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('AI solution received:', data);
                if (data.status === 'solved') {
                    selectCorrectImages(data.solution, numberToSelect, captchaImages);
                } else {
                    console.error('Captcha could not be solved:', data);
                }
            })
            .catch(error => {
                console.error('Error solving captcha:', error);
            });
    }

    function selectCorrectImages(solution, numberToSelect, captchaImages) {
        Object.keys(solution).forEach(index => {
            if (solution[index] === numberToSelect) {
                const img = captchaImages[index];
                if (img) {
                    img.click();
                    console.log(`Image at index ${index} with number ${solution[index]} selected.`);
                }
            }
        });

        const submitButton = document.querySelector('#captchaForm > div.text-center.row.no-gutters.img-actions.p-2 > div:nth-child(3)');
        if (submitButton) {
            setTimeout(() => {
                submitButton.click();
            }, 100);
        } else {
            console.error('Submit button not found.');
        }
    }

    function isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    function isClickable(element) {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && isVisible(element);
    }

    toggleButton.addEventListener('click', () => {
        scriptActive = !scriptActive;
        GM_setValue('scriptActive', scriptActive);
        if (scriptActive) {
            toggleButton.textContent = 'No Captcha AI Start';
            toggleButton.style.backgroundColor = 'green';
            handleCaptcha();
        } else {
            toggleButton.textContent = 'No Captcha AI Stop';
            toggleButton.style.backgroundColor = 'red';
        }
    });

    window.addEventListener('load', function () {
        console.log("Document fully loaded, starting captcha polling");
        if (scriptActive) {
            handleCaptcha();
        }
    });
})();
