// ============================================================
// CREATE.JS
// Text to Mock Test
// GitHub Pages / No Firebase / No Server
// ============================================================
import {
    parseMCQs,
    esc,
    encodeTest
} from './common.js';
// ============================================================
// VARIABLES
// ============================================================
let parsed = null;
const title =
    document.getElementById('title');
const minutes =
    document.getElementById('minutes');
const source =
    document.getElementById('source');
const preview =
    document.getElementById('preview');
const msg =
    document.getElementById('msg');
const linkBtn =
    document.getElementById('linkBtn');
const previewBtn =
    document.getElementById('previewBtn');
// ============================================================
// PARSE & PREVIEW
// ============================================================
previewBtn.onclick = function () {
    try {
        parsed = parseMCQs(
            source.value
        );
        // ----------------------------------------------------
        // No questions found
        // ----------------------------------------------------
        if (
            !parsed ||
            parsed.length === 0
        ) {
            msg.innerHTML =
                '<p class="error">' +
                '❌ No questions detected.' +
                '<br><br>' +
                'Please make sure your text contains:' +
                '<br>1. Question' +
                '<br>A) Option A' +
                '<br>B) Option B' +
                '<br>C) Option C' +
                '<br>D) Option D' +
                '<br>Answer: A) Option A' +
                '</p>';
            preview.innerHTML = '';
            linkBtn.classList.add(
                'hidden'
            );
            return;
        }
        // ----------------------------------------------------
        // Check missing answers
        // ----------------------------------------------------
        const missing =
            parsed.filter(
                q => !q.answer
            ).length;
        msg.innerHTML =
            '<p class="successText">' +
            '✓ ' +
            parsed.length +
            ' questions detected' +
            (
                missing
                    ? ' • ' +
                      missing +
                      ' answer(s) not detected'
                    : ''
            ) +
            '.</p>';
        // ----------------------------------------------------
        // Build preview
        // ----------------------------------------------------
        preview.innerHTML =
            parsed.map(function (q) {
                const options =
                    Object.entries(
                        q.options
                    )
                    .map(function (
                        [key, value]
                    ) {
                        return (
                            '<div class="previewOption">' +
                            '<b>' +
                            esc(key) +
                            ') </b>' +
                            esc(value) +
                            '</div>'
                        );
                    })
                    .join('');
                return (
                    '<article class="card">' +
                    '<h3>' +
                    q.id +
                    '. ' +
                    esc(
                        q.question
                    ) +
                    '</h3>' +
                    options +
                    '<p class="answerLine">' +
                    'Correct: ' +
                    '<b>' +
                    esc(
                        q.answer ||
                        'Not detected'
                    ) +
                    '</b>' +
                    '</p>' +
                    '</article>'
                );
            }).join('');
        // ----------------------------------------------------
        // Show generate button
        // ----------------------------------------------------
        linkBtn.classList.remove(
            'hidden'
        );
    } catch (error) {
        console.error(
            'Parse error:',
            error
        );
        msg.innerHTML =
            '<p class="error">' +
            '❌ Error while parsing questions.' +
            '<br><br>' +
            esc(
                error.message ||
                String(error)
            ) +
            '</p>';
        preview.innerHTML = '';
        linkBtn.classList.add(
            'hidden'
        );
    }
};
// ============================================================
// GENERATE SHAREABLE LINK
// ============================================================
linkBtn.onclick = function () {
    if (
        !parsed ||
        parsed.length === 0
    ) {
        alert(
            'Please click Parse & Preview first.'
        );
        return;
    }
    // --------------------------------------------------------
    // Disable button
    // --------------------------------------------------------
    linkBtn.disabled = true;
    linkBtn.textContent =
        'Generating...';
    try {
        // ====================================================
        // CREATE TEST DATA
        // ====================================================
        const data = {
            v: 1,
            title:
                title.value.trim() ||
                'My Mock Test',
            minutes:
                Math.max(
                    1,
                    Number(
                        minutes.value
                    ) || 30
                ),
            questions:
                parsed
        };
        // ====================================================
        // ENCODE TEST
        //
        // IMPORTANT:
        // common.js encodeTest() MUST be synchronous.
        //
        // It should contain:
        //
        // export function encodeTest(obj) {
        //     const json = JSON.stringify(obj);
        //     return 'u' + encodeURIComponent(json);
        // }
        // ====================================================
        const token =
            encodeTest(data);
        // ====================================================
        // SAFETY CHECK
        // ====================================================
        if (
            !token ||
            typeof token !== 'string'
        ) {
            throw new Error(
                'Invalid token generated.'
            );
        }
        // Detect old Promise problem
        if (
            token === '[object Promise]'
        ) {
            throw new Error(
                'encodeTest is still asynchronous. Please replace common.js with the latest synchronous version.'
            );
        }
        // ====================================================
        // CREATE BASE URL
        // ====================================================
        const baseUrl =
            window.location.origin +
            window.location.pathname
                .replace(
                    /index\.html$/,
                    ''
                );
        // ====================================================
        // CREATE STUDENT TEST URL
        // ====================================================
        const url =
            baseUrl +
            'test.html#t=' +
            token;
        // ====================================================
        // SHARE TEXT
        // ====================================================
        const shareText =
            '📝 ' +
            data.title +
            '\n⏱️ ' +
            data.minutes +
            ' minutes' +
            '\n📚 ' +
            data.questions.length +
            ' questions' +
            '\n\nTake the mock test here:\n' +
            url;
        // ====================================================
        // DISPLAY SHARE BOX
        // ====================================================
        msg.innerHTML =
            '<div class="shareBox">' +
            '<b>✅ Test Link Generated</b>' +
            '<br><br>' +
            '<input ' +
            'id="shareUrl" ' +
            'value="' +
            esc(url) +
            '" ' +
            'readonly>' +
            '<br><br>' +
            '<button id="copyBtn">' +
            '📋 Copy Link' +
            '</button>' +
            '<button id="shareBtn">' +
            '📤 Share' +
            '</button>' +
            '<br><br>' +
            '<small>' +
            data.questions.length +
            ' questions • ' +
            data.minutes +
            ' minutes' +
            '<br>' +
            'No Firebase, server or database required.' +
            '</small>' +
            '</div>' +
            '<p class="successText">' +
            '✓ Shareable link generated successfully.' +
            '</p>';
        // ====================================================
        // COPY BUTTON
        // ====================================================
        const copyBtn =
            document.getElementById(
                'copyBtn'
            );
        copyBtn.onclick =
            async function () {
                const input =
                    document.getElementById(
                        'shareUrl'
                    );
                try {
                    await navigator
                        .clipboard
                        .writeText(
                            url
                        );
                    copyBtn.textContent =
                        '✅ Copied!';
                } catch (error) {
                    input.focus();
                    input.select();
                    input.setSelectionRange(
                        0,
                        input.value.length
                    );
                    try {
                        document.execCommand(
                            'copy'
                        );
                        copyBtn.textContent =
                            '✅ Copied!';
                    } catch (copyError) {
                        alert(
                            'Please copy the link manually.'
                        );
                    }
                }
            };
        // ====================================================
        // SHARE BUTTON
        // ====================================================
        const shareBtn =
            document.getElementById(
                'shareBtn'
            );
        shareBtn.onclick =
            async function () {
                if (
                    navigator.share
                ) {
                    try {
                        await navigator.share({
                            title:
                                data.title,
                            text:
                                shareText,
                            url:
                                url
                        });
                    } catch (error) {
                        console.log(
                            'Share cancelled.'
                        );
                    }
                    return;
                }
                // Browser without Web Share API
                try {
                    await navigator
                        .clipboard
                        .writeText(
                            shareText
                        );
                    alert(
                        'Share message copied. Paste it into WhatsApp.'
                    );
                } catch (error) {
                    alert(
                        shareText
                    );
                }
            };
        // ====================================================
        // DEBUG
        // ====================================================
        console.log(
            'Test data:',
            data
        );
        console.log(
            'Token:',
            token
        );
        console.log(
            'Test URL:',
            url
        );
    } catch (error) {
        console.error(
            'Link generation error:',
            error
        );
        msg.innerHTML =
            '<div class="shareBox">' +
            '<p class="error">' +
            '❌ Unable to generate test link.' +
            '</p>' +
            '<p>' +
            '<b>Error:</b><br>' +
            esc(
                error.message ||
                String(error)
            ) +
            '</p>' +
            '</div>';
    }
    // ========================================================
    // RESTORE BUTTON
    // ========================================================
    linkBtn.disabled = false;
    linkBtn.textContent =
        'Generate Shareable Link';
};
