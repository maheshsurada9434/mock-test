import {
    parseMCQs,
    esc,
    encodeTest
} from './common.js';
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
        parsed = parseMCQs(source.value);
        if (!parsed || !parsed.length) {
            msg.innerHTML =
                '<p class="error">' +
                'No questions detected. ' +
                'Make sure your questions contain ' +
                '1., 2., 3., A), B), C), D) and Answer:.' +
                '</p>';
            preview.innerHTML = '';
            linkBtn.classList.add('hidden');
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
                        q.answer ||
                        'Not detected'
                    ) +
                    '</b>' +
                    '</p>' +
                    '</article>'
                );
            }).join('');
        linkBtn.classList.remove('hidden');
    } catch (error) {
        console.error(
            'Parse error:',
            error
        );
        msg.innerHTML =
            '<p class="error">' +
            'Error while parsing questions.' +
            '</p>';
        linkBtn.classList.add('hidden');
    }
};
// ============================================================
// GENERATE SHAREABLE LINK
// ============================================================
linkBtn.onclick = function () {
    if (!parsed || !parsed.length) {
        alert(
            'Please click Parse & Preview first.'
        );
        return;
    }
    try {
        // Show generating status
        linkBtn.disabled = true;
        linkBtn.textContent =
            'Generating...';
        // ----------------------------------------------------
        // Create test data
        // ----------------------------------------------------
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
        // ----------------------------------------------------
        // Encode immediately
        // ----------------------------------------------------
        const token =
            encodeTest(data);
        // ----------------------------------------------------
        // Create test URL
        // ----------------------------------------------------
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
            token;
        // ----------------------------------------------------
        // Share text
        // ----------------------------------------------------
        const shareText =
            '📝 ' +
            data.title +
            '\n' +
            '⏱️ ' +
            data.minutes +
            ' minutes\n' +
            '📚 ' +
            data.questions.length +
            ' questions\n\n' +
            'Take the mock test here:\n' +
            url;
        // ----------------------------------------------------
        // Display link
        // ----------------------------------------------------
        msg.innerHTML =
            '<div class="shareBox">' +
            '<b>Shareable Test Link</b>' +
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
            'Send this link to your students. ' +
            'No Firebase or server is required.' +
            '</small>' +
            '</div>';
        // ----------------------------------------------------
        // Copy button
        // ----------------------------------------------------
        const copyBtn =
            document.getElementById(
                'copyBtn'
            );
        copyBtn.onclick =
            async function () {
                try {
                    await navigator.clipboard
                        .writeText(url);
                    copyBtn.textContent =
                        'Copied!';
                } catch (error) {
                    const input =
                        document.getElementById(
                            'shareUrl'
                        );
                    input.focus();
                    input.select();
                    document.execCommand(
                        'copy'
                    );
                    copyBtn.textContent =
                        'Copied!';
                }
            };
        // ----------------------------------------------------
        // Share button
        // ----------------------------------------------------
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
                } else {
                    try {
                        await navigator.clipboard
                            .writeText(
                                shareText
                            );
                        alert(
                            'Share text copied. ' +
                            'Paste it into WhatsApp.'
                        );
                    } catch (error) {
                        alert(
                            shareText
                        );
                    }
                }
            };
    } catch (error) {
        console.error(
            'Link generation error:',
            error
        );
        msg.innerHTML =
            '<p class="error">' +
            'Unable to generate the test link.' +
            '<br><br>' +
            '<b>Error:</b> ' +
            esc(error.message || error) +
            '</p>';
    }
    // --------------------------------------------------------
    // Restore button
    // --------------------------------------------------------
    linkBtn.disabled = false;
    linkBtn.textContent =
        'Generate Shareable Link';
};
