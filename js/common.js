export function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
}


/*
    TEXT TO MCQ PARSER

    Supports:

    1. Question
    A) Option A
    B) Option B
    C) Option C
    D) Option D
    Answer: A) Option A

    AND compact format:

    Answer: A) Option A2. Next question
    A) ...
    B) ...
    Answer: B) ...
*/


export function parseMCQs(text) {

    if (!text) {
        return [];
    }

    // Normalize text
    text = text
        .replace(/\r/g, '')
        .replace(/\u00a0/g, ' ')
        .trim();

    /*
        Add a newline before question numbers.

        This handles:

        Answer: A) Something2. Next question

        and converts it to:

        Answer: A) Something
        2. Next question
    */

    text = text.replace(
        /\s+(?=\d+\.\s+)/g,
        '\n'
    );

    /*
        Find question numbers.
    */

    const questionRegex = /(?:^|\n)\s*(\d+)\.\s+/g;

    const starts = [];
    let match;

    while ((match = questionRegex.exec(text)) !== null) {

        starts.push({
            number: Number(match[1]),
            index: match.index,
            contentIndex: match.index + match[0].length
        });
    }

    if (!starts.length) {
        return [];
    }

    const questions = [];

    for (let i = 0; i < starts.length; i++) {

        const start = starts[i].contentIndex;

        const end =
            i + 1 < starts.length
                ? starts[i + 1].index
                : text.length;

        let block = text
            .slice(start, end)
            .trim();

        if (!block) {
            continue;
        }


        /*
            Find Answer:

            Answer: A) Mirabai Chanu
        */

        const answerMatch = block.match(
            /\bAnswer\s*:\s*([A-D])\)\s*(.*?)\s*$/is
        );

        let answer = null;

        if (answerMatch) {
            answer = answerMatch[1].toUpperCase();

            // Remove Answer section
            block = block
                .slice(0, answerMatch.index)
                .trim();
        }


        /*
            Find A), B), C), D) options.
        */

        const optionRegex =
            /(?:^|\s)([A-D])\)\s*(.*?)(?=\s+[A-D]\)\s+|$)/gs;

        const optionMatches = [];

        let optionMatch;

        while ((optionMatch = optionRegex.exec(block)) !== null) {

            optionMatches.push({
                letter: optionMatch[1].toUpperCase(),
                text: optionMatch[2].trim()
            });
        }


        /*
            Need at least two options.
        */

        if (optionMatches.length < 2) {
            continue;
        }


        /*
            Question text is everything before first option.
        */

        const firstOptionIndex = block.search(
            /(?:^|\s)[A-D]\)\s+/i
        );

        let questionText = '';

        if (firstOptionIndex >= 0) {

            questionText = block
                .slice(0, firstOptionIndex)
                .trim();

        } else {

            questionText = block.trim();
        }


        /*
            Build options object.
        */

        const options = {};

        optionMatches.forEach(function (item) {
            options[item.letter] = item.text;
        });


        /*
            Add question.
        */

        if (
            questionText &&
            Object.keys(options).length >= 2
        ) {

            questions.push({
                id: starts[i].number,
                question: questionText,
                options: options,
                answer: answer
            });
        }
    }


    /*
        Return questions in correct order.
    */

    return questions;
}


/*
    Convert bytes to Base64 URL-safe format.
*/

function bytesToB64(bytes) {

    let binary = '';

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {

        binary += String.fromCharCode(
            ...bytes.subarray(
                i,
                i + chunkSize
            )
        );
    }

    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


/*
    Convert Base64 back to bytes.
*/

function b64ToBytes(str) {

    str = str
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    while (str.length % 4) {
        str += '=';
    }

    const binary = atob(str);

    const bytes = new Uint8Array(
        binary.length
    );

    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}


/*
    Compress and encode test.
*/

export async function encodeTest(obj) {

    const raw = new TextEncoder().encode(
        JSON.stringify(obj)
    );


    /*
        Use browser gzip compression
        when available.
    */

    if ('CompressionStream' in window) {

        const cs =
            new CompressionStream('gzip');

        const writer =
            cs.writable.getWriter();

        writer.write(raw);
        writer.close();

        const buffer =
            await new Response(
                cs.readable
            ).arrayBuffer();

        return 'g' +
            bytesToB64(
                new Uint8Array(buffer)
            );
    }


    /*
        Fallback when compression
        is not supported.
    */

    return 'u' +
        encodeURIComponent(
            JSON.stringify(obj)
        );
}


/*
    Decode test from shareable URL.
*/

export async function decodeTest(token) {

    if (!token) {
        return null;
    }

    try {

        /*
            Uncompressed test
        */

        if (token[0] === 'u') {

            return JSON.parse(
                decodeURIComponent(
                    token.slice(1)
                )
            );
        }


        /*
            Compressed test
        */

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

            writer.write(bytes);
            writer.close();

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
            'Test decoding error:',
            error
        );
    }

    return null;
}


/*
    Get test token from URL.
*/

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


/*
    Format seconds as MM:SS.
*/

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
