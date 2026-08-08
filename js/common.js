export function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

export function parseMCQs(text) {

    if (!text) return [];

    text = text
        .replace(/\r/g, '')
        .replace(/\u00a0/g, ' ')
        .trim();

    /*
     * Add a newline before every question number.
     * This allows both:
     *
     * 1. Question...
     * Answer: A) Something
     * 2. Next question...
     *
     * and:
     *
     * Answer: A) Something2. Next question...
     */

    text = text.replace(
        /(?<!^)\s+(?=\d+\.\s+)/g,
        '\n'
    );

    const questionRegex = /(?:^|\n)\s*(\d+)\.\s+/g;

    const starts = [];
    let match;

    while ((match = questionRegex.exec(text)) !== null) {
        starts.push({
            number: Number(match[1]),
            start: match.index + match[0].length,
            index: match.index
        });
    }

    if (!starts.length) return [];

    const output = [];

    for (let i = 0; i < starts.length; i++) {

        const start = starts[i].start;

        const end =
            i + 1 < starts.length
                ? starts[i + 1].index
                : text.length;

        let block = text.slice(start, end).trim();

        if (!block) continue;

        /*
         * Find Answer: A)
         */

        const answerMatch = block.match(
            /\bAnswer\s*:\s*([A-D])\)\s*(.*?)\s*$/is
        );

        let answer = null;

        if (answerMatch) {
            answer = answerMatch[1].toUpperCase();

            block = block
                .slice(0, answerMatch.index)
                .trim();
        }

        /*
         * Find A), B), C), D)
         */

        const optionRegex =
            /(?:^|\s)([A-D])\)\s*(.*?)(?=\s+[A-D]\)\s+|$)/gs;

        const options = {};
        const optionPositions = [];

        let optionMatch;

        while ((optionMatch = optionRegex.exec(block)) !== null) {

            const letter = optionMatch[1].toUpperCase();
            const value = optionMatch[2].trim();

            options[letter] = value;

            optionPositions.push({
                letter,
                index: optionMatch.index
            });
        }

        if (Object.keys(options).length < 2) {
            continue;
        }

        /*
         * Question text is before A)
         */

        const firstOption =
            block.search(/(?:^|\s)[A-D]\)\s+/i);

        let question = '';

        if (firstOption >= 0) {
            question = block
                .slice(0, firstOption)
                .trim();
        } else {
            question = block.trim();
        }

        if (!question) continue;

        output.push({
            id: starts[i].number,
            question: question,
            options: options,
            answer: answer
        });
    }

    return output;
}


/* ------------------------------
   Encoding / Compression
-------------------------------- */

function bytesToB64(bytes) {

    let binary = '';

    const chunk = 0x8000;

    for (let i = 0; i < bytes.length; i += chunk) {

        binary += String.fromCharCode(
            ...bytes.subarray(i, i + chunk)
        );
    }

    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


function b64ToBytes(str) {

    str = str
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    while (str.length % 4) {
        str += '=';
    }

    const binary = atob(str);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}


/* ------------------------------
   Encode Test
-------------------------------- */

export async function encodeTest(obj) {

    const raw = new TextEncoder().encode(
        JSON.stringify(obj)
    );

    if ('CompressionStream' in window) {

        const cs =
            new CompressionStream('gzip');

        const writer =
            cs.writable.getWriter();

        await writer.write(raw);
        await writer.close();

        const buffer =
            await new Response(
                cs.readable
            ).arrayBuffer();

        return 'g' +
            bytesToB64(
                new Uint8Array(buffer)
            );
    }

    return 'u' +
        encodeURIComponent(
            JSON.stringify(obj)
        );
}


/* ------------------------------
   Decode Test
-------------------------------- */

export async function decodeTest(token) {

    if (!token) return null;

    try {

        if (token[0] === 'u') {

            return JSON.parse(
                decodeURIComponent(
                    token.slice(1)
                )
            );
        }

        if (
            token[0] === 'g' &&
            'DecompressionStream' in window
        ) {

            const bytes =
                b64ToBytes(
                    token.slice(1)
                );

            const ds =
                new DecompressionStream('gzip');

            const writer =
                ds.writable.getWriter();

            await writer.write(bytes);
            await writer.close();

            const buffer =
                await new Response(
                    ds.readable
                ).arrayBuffer();

            return JSON.parse(
                new TextDecoder().decode(buffer)
            );
        }

    } catch (error) {

        console.error(
            'Decode error:',
            error
        );
    }

    return null;
}


/* ------------------------------
   Get Token From URL
-------------------------------- */

export function tokenFromUrl() {

    if (
        location.hash &&
        location.hash.startsWith('#t=')
    ) {
        return location.hash.slice(3);
    }

    return new URLSearchParams(
        location.search
    ).get('t');
}


/* ------------------------------
   Timer Format
-------------------------------- */

export function fmt(sec) {

    sec = Math.max(
        0,
        Math.floor(sec)
    );

    return String(
        Math.floor(sec / 60)
    ).padStart(2, '0') +
    ':' +
    String(
        sec % 60
    ).padStart(2, '0');
}
