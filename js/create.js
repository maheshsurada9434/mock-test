import {
    parseMCQs,
    esc,
    encodeTest
} from './common.js';
let parsed = null;
const title = document.getElementById('title');
const minutes = document.getElementById('minutes');
const source = document.getElementById('source');
const preview = document.getElementById('preview');
const msg = document.getElementById('msg');
const linkBtn = document.getElementById('linkBtn');
const previewBtn = document.getElementById('previewBtn');
// ============================================================
// PARSE & PREVIEW
// ============================================================
previewBtn.onclick = function () {
    try {
        parsed = parseMCQs(source.value);
        if (!parsed || !parsed.length) {
            msg.innerHTML =
                '<p class="error">' +
                '❌ No questions detected.' +
                '<br><br>' +
                'Make sure your text contains:' +
                '<br>1. Question' +
                '<br>A) Option' +
                '<br>B) Option' +
                '<br>C) Option' +
                '<br>D) Option' +
                '<br>Answer: A) Option' +
                '</p>';
            preview.innerHTML = '';
            linkBtn.classList.add('hidden');
            return;
        }
        const missing =
            parsed.filter(q => !q.answer).length;
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
        preview.innerHTML =
            parsed.map(function (q) {
                const options =
                    Object.entries(q.options)
                        .map(function ([key, value]) {
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
                    esc(q.question) +
                    '</h3>' +
                    options +
                    '<p class="answerLine">' +
                    'Correct: <b>' +
                    esc(
                        q.answer || 'Not detected'
                    ) +
                    '</b>' +
                    '</p>' +
                    '</article>'
                );
            }).join('');
        linkBtn.classList.remove('hidden');
    } catch (error) {
        console.error('Parse error:', error);
        msg.innerHTML =
            '<p class="error">' +
            '❌ Error while parsing questions.' +
            '<br><br>' +
            esc(error.message || String(error)) +
            '</p>';
        preview.innerHTML = '';
        linkBtn.classList.add('hidden');
    }
};
// ============================================================
// GENERATE SHAREABLE LINK
// ============================================================
linkBtn.onclick = async function () {
    if (!parsed || !parsed.length) {
        alert(
            'Please click Parse & Preview first.'
        );
        return;
    }
    linkBtn.disabled = true;
    linkBtn.textContent = 'Generating...';
    try {
        const data = {
            v: 1,
            title:
                title.value.trim() ||
                'Mock Test',
            minutes:
                Math.max(
                    1,
                    Number(minutes.value) || 30
                ),
            questions:
                parsed
        };
        // ====================================================
        // IMPORTANT
        // Await works with both:
        // - normal string
        // - Promise
        // ====================================================
        let token =
            await encodeTest(data);
        // Convert to string only after await
        token =
            String(token);
        // ====================================================
        // Detect old [object Promise] problem
        // ====================================================
        if (
            token === '[object Promise]'
        ) {
            throw new Error(
                'encodeTest() is still returning a Promise. Please make sure the latest common.js is uploaded to GitHub.'
            );
        }
        if (
            !token ||
            token === 'undefined' ||
            token === 'null'
        ) {
            throw new Error(
                'No test token was generated.'
            );
        }
        // ====================================================
        // Create URL
        // ====================================================
        const baseUrl =
            location.href
                .split('#')[0]
                .replace(
                    /index\.html$/,
                    ''
                );
        const url =
            baseUrl +
            'test.html#t=' +
            encodeURIComponent(token);
        // ====================================================
        // Share text
        // ====================================================
        const shareText =
            '📝 ' +
            data.title +
            '\n' +
            '⏱️ ' +
            data.minutes +
            ' minutes' +
            '\n' +
            '📚 ' +
            data.questions.length +
            ' questions' +
            '\n\n' +
            'Take the mock test here:\n' +
            url;
        // ====================================================
        // SHOW SHARE BOX
        // ====================================================
        msg.innerHTML =
            '<div class="shareBox">' +
            '<b>✅ Shareable Test Link</b>' +
            '<input ' +
            'id="shareUrl" ' +
            'value="' +
            esc(url) +
            '" ' +
            'readonly>' +
            '<button id="copyBtn">' +
            'Copy Link' +
            '</button>' +
            '<button id="shareBtn">' +
            'Share' +
            '</button>' +
            '<small>' +
            'Send this link to your students.' +
            '</small>' +
            '</div>' +
            '<p class="successText">' +
            '✓ Test link generated successfully.' +
            '</p>';
        // ====================================================
        // COPY
        // ====================================================
        document.getElementById(
            'copyBtn'
        ).onclick = async function () {
            const button = this;
            const input =
                document.getElementById(
                    'shareUrl'
                );
            try {
                await navigator.clipboard.writeText(
                    url
                );
                button.textContent =
                    'Copied!';
            } catch (error) {
                input.focus();
                input.select();
                input.setSelectionRange(
                    0,
                    input.value.length
                );
                try {
                    document.execCommand('copy');
                    button.textContent =
                        'Copied!';
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
        document.getElementById(
            'shareBtn'
        ).onclick = async function () {
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
                    'Share text copied. Paste it into WhatsApp.'
                );
            } catch (error) {
                alert(shareText);
            }
        };
        console.log(
            'Generated URL:',
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
            '❌ Unable to generate the test link.' +
            '</p>' +
            '<p>' +
            '<b>Error:</b> ' +
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
