import { parseMCQs, esc, encodeTest } from './common.js';

let parsed = null;

const title = document.getElementById('title');
const minutes = document.getElementById('minutes');
const source = document.getElementById('source');
const preview = document.getElementById('preview');
const msg = document.getElementById('msg');
const linkBtn = document.getElementById('linkBtn');
const previewBtn = document.getElementById('previewBtn');

previewBtn.onclick = () => {
    parsed = parseMCQs(source.value);

    if (!parsed.length) {
        msg.innerHTML =
            '<p class="error">No questions detected. Make sure each question starts with 1., 2., 3. and contains A), B), C), D) plus Answer:.</p>';

        linkBtn.classList.add('hidden');
        preview.innerHTML = '';
        return;
    }

    const missing = parsed.filter(q => !q.answer).length;

    msg.innerHTML =
        '<p class="successText">✓ ' +
        parsed.length +
        ' questions detected' +
        (missing
            ? ' • ' + missing + ' answer(s) not detected'
            : '') +
        '.</p>';

    preview.innerHTML = parsed
        .map(q => {
            return (
                '<article class="card">' +
                '<h3>' +
                q.id +
                '. ' +
                esc(q.question) +
                '</h3>' +

                Object.entries(q.options)
                    .map(([k, v]) => {
                        return (
                            '<div class="previewOption">' +
                            '<b>' +
                            k +
                            ') </b>' +
                            esc(v) +
                            '</div>'
                        );
                    })
                    .join('') +

                '<p class="answerLine">Correct: <b>' +
                esc(q.answer || 'Not detected') +
                '</b></p>' +

                '</article>'
            );
        })
        .join('');

    linkBtn.classList.remove('hidden');
};

linkBtn.onclick = async () => {

    if (!parsed || !parsed.length) {
        alert('Please parse the questions first.');
        return;
    }

    linkBtn.disabled = true;
    linkBtn.textContent = 'Generating…';

    try {

        const data = {
            v: 1,
            title: title.value.trim() || 'Mock Test',
            minutes: Math.max(1, Number(minutes.value) || 30),
            questions: parsed
        };

        const token = await encodeTest(data);

        const baseUrl = location.href
            .split('#')[0]
            .replace(/index\.html$/, '');

        const url = baseUrl + 'test.html#t=' + token;

        const shareText =
            '📝 ' + data.title + '\n' +
            '⏱️ ' + data.minutes + ' minutes\n' +
            '📚 ' + data.questions.length + ' questions\n\n' +
            'Take the mock test here:\n' +
            url;

        msg.innerHTML =
            '<div class="shareBox">' +
            '<b>Shareable Test Link</b>' +
            '<input id="shareUrl" value="' + esc(url) + '" readonly>' +
            '<button id="copyBtn">Copy Link</button>' +
            '<button id="shareBtn">Share</button>' +
            '<small>For large tests, the link can become long. Modern browsers compress the test data automatically.</small>' +
            '</div>';

        document.getElementById('copyBtn').onclick = async () => {

            try {
                await navigator.clipboard.writeText(url);

                document.getElementById('copyBtn').textContent = 'Copied!';

            } catch (error) {

                const input = document.getElementById('shareUrl');
                input.select();
                document.execCommand('copy');

                document.getElementById('copyBtn').textContent = 'Copied!';
            }
        };

        document.getElementById('shareBtn').onclick = async () => {

            if (navigator.share) {

                await navigator.share({
                    title: data.title,
                    text: shareText,
                    url: url
                });

            } else {

                try {

                    await navigator.clipboard.writeText(shareText);

                    alert('Share text copied. Paste it into WhatsApp.');

                } catch (error) {

                    alert(shareText);
                }
            }
        };

    } catch (error) {

        console.error(error);

        msg.innerHTML =
            '<p class="error">Unable to generate the test link. Please check the browser console or try again.</p>';

    }

    linkBtn.disabled = false;
    linkBtn.textContent = 'Generate Shareable Link';
};
