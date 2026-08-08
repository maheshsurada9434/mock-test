// ============================================================
// CREATE.JS
// Text to Mock Test
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
        parsed =
            parseMCQs(
                source.value
            );
        // ----------------------------------------------------
        // No questions
        // ----------------------------------------------------
        if (
            !parsed ||
            !parsed.length
        ) {
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
        // Create preview
        // ----------------------------------------------------
        preview.innerHTML =
            parsed
                .map(function (q) {
                    const options =
                        Object.entries(
                            q.options
                        )
                        .map(
                            function (
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
                            }
                        )
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
                })
                .join('');
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
//
// IMPORTANT:
// This function is async so it works with BOTH:
//
// 1. synchronous encodeTest()
// 2. asynchronous encodeTest()
//
// This prevents:
// #t=[object Promise]
//
// ============================================================
linkBtn.onclick = async function () {
    if (
        !parsed ||
        !parsed.length
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
        // ----------------------------------------------------
        // Create test object
        // ----------------------------------------------------
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
        // ----------------------------------------------------
        // Encode test
        //
        // await works whether encodeTest()
        // returns a Promise or normal value.
        // ----------------------------------------------------
        const token =
            await encodeTest(
                data
            );
        // ----------------------------------------------------
        // Safety check
        // ----------------------------------------------------
        if (
            !token ||
            typeof token !== 'string'
        ) {
            throw new Error(
                'Invalid test token generated.'
            );
        }
        // ----------------------------------------------------
        // Create base URL
        // ----------------------------------------------------
        const baseUrl =
            location.href
                .split('#')[0]
                .replace(
                    /index\.html$/,
                    ''
                );
        // ----------------------------------------------------
        // Create student test URL
        // ----------------------------------------------------
        const url =
            baseUrl +
            'test.html#t=' +
            token;
        // ----------------------------------------------------
        // Share message
        // ----------------------------------------------------
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
            'Take the mock test here:' +
            '\n' +
            url;
        // ----------------------------------------------------
        // Display share box
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
            'No Firebase, server or database is required.' +
            '</small>' +
            '</div>';
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
                        'Copied!';
                } catch (error) {
                    // iPhone / browser fallback
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
                            'Copied!';
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
                // ------------------------------------------------
                // Mobile Share
                // ------------------------------------------------
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
                        // User cancelled share
                        console.log(
                            'Share cancelled.'
                        );
                    }
                    return;
                }
                // ------------------------------------------------
                // Clipboard fallback
                // ------------------------------------------------
                try {
                    await navigator
                        .clipboard
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
            };
        // ----------------------------------------------------
        // SUCCESS MESSAGE
        // ----------------------------------------------------
        msg.innerHTML +=
            '<p class="successText">' +
            '✓ Test link generated successfully.' +
            '</p>';
        // ----------------------------------------------------
        // Log for debugging
        // ----------------------------------------------------
        console.log(
            'Generated test:',
            data
        );
        console.log(
            'Generated token:',
            token
        );
        console.log(
            'Generated URL:',
            url
        );
    } catch (error) {
        // ----------------------------------------------------
        // Error
        // ----------------------------------------------------
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
    // --------------------------------------------------------
    // Restore button
    // --------------------------------------------------------
    linkBtn.disabled = false;
    linkBtn.textContent =
        'Generate Shareable Link';
};
