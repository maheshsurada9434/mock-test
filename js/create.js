// ============================================================
// CREATE.JS
// Text to Mock Test
// GitHub Pages
// No Firebase
// No Server
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
        if (!parsed || parsed.length === 0) {
            msg.innerHTML =
                '<p class="error">' +
                '❌ No questions detected.' +
                '<br><br>' +
                'Make sure your text contains:' +
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
        // ====================================================
        // PREVIEW QUESTIONS
        // ====================================================
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
                    'Correct: <b>' +
                    esc(
                        q.answer ||
                        'Not detected'
                    ) +
                    '</b>' +
                    '</p>' +
                    '</article>'
                );
            }).join('');
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
    linkBtn.disabled = true;
    linkBtn.textContent =
        'Generating...';
    try {
        // ====================================================
        // TEST DATA
        // ====================================================
        const data = {
            v: 1,
            title:
                title.value.trim() ||
                'Mock Test',
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
        // ENCODE
        //
        // IMPORTANT:
        // encodeTest MUST return a STRING.
        // ====================================================
        const token =
            encodeTest(data);
        // ====================================================
        // CHECK TOKEN
        // ====================================================
        if (
            typeof token !== 'string'
        ) {
            throw new Error(
                'encodeTest did not return a string.'
            );
        }
        if (
            token === '[object Promise]'
        ) {
            throw new Error(
                'common.js is still using an asynchronous encodeTest(). Replace common.js with the synchronous version.'
            );
        }
        if (
            token.length < 2
        ) {
            throw new Error(
                'Empty test token generated.'
            );
        }
        // ====================================================
        // BASE URL
        // ====================================================
        const baseUrl =
            window.location.origin +
            window.location.pathname
                .replace(
                    /index\.html$/,
                    ''
                );
        // ====================================================
        // FINAL TEST URL
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
        // DISPLAY LINK
        // ====================================================
        msg.innerHTML =
            '<div class="shareBox">' +
            '<b>✅ Shareable Test Link</b>' +
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
            'No Firebase or server required.' +
            '</small>' +
            '</div>' +
            '<p class="successText">' +
            '✓ Test link generated successfully.' +
            '</p>';
        // ====================================================
        // COPY LINK
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
                    await navigator.clipboard.writeText(
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
        // SHARE
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
                            'Share cancelled'
                        );
                    }
                    return;
                }
                try {
                    await navigator.clipboard.writeText(
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
            'Generated token:',
            token
        );
        console.log(
            'Generated URL:',
            url
        );
    } catch (error) {
        console.error(
            'Generation error:',
            error
        );
        msg.innerHTML =
            '<div class="shareBox">' +
            '<p class="error">' +
            '❌ Unable to generate the test link.' +
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
    linkBtn.disabled = false;
    linkBtn.textContent =
        'Generate Shareable Link';
};
