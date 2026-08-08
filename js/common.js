// ============================================================
// COMMON.JS
// Text to Mock Test
// GitHub Pages
// No Firebase
// No Server
// ============================================================
// ============================================================
// ESCAPE HTML
// ============================================================
export function esc(s) {
    return String(s ?? '').replace(
        /[&<>"']/g,
        function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[m];
        }
    );
}
// ============================================================
// PARSE MCQs
// ============================================================
export function parseMCQs(text) {
    if (!text) {
        return [];
    }
    text = String(text)
        .replace(/\r/g, '')
        .replace(/\u00a0/g, ' ')
        .trim();
    if (!text) {
        return [];
    }
    // --------------------------------------------------------
    // Fix joined questions
    // Example:
    // Delhi2. What is...
    // --------------------------------------------------------
    text = text.replace(
        /(?<!^)\s+(?=\d+\.\s+)/g,
        '\n'
    );
    text = text.replace(
        /([^\d\s])(\d+)\.\s+/g,
        '$1\n$2. '
    );
    // --------------------------------------------------------
    // Find question numbers
    // --------------------------------------------------------
    const questionRegex =
        /(?:^|\n)\s*(\d+)\.\s+/g;
    const starts = [];
    let match;
    while (
        (match = questionRegex.exec(text)) !== null
    ) {
        starts.push({
            number: Number(match[1]),
            start:
                match.index +
                match[0].length,
            index:
                match.index
        });
    }
    if (!starts.length) {
        return [];
    }
    const output = [];
    // ========================================================
    // PROCESS QUESTIONS
    // ========================================================
    for (
        let i = 0;
        i < starts.length;
        i++
    ) {
        const start =
            starts[i].start;
        const end =
            i + 1 < starts.length
                ? starts[i + 1].index
                : text.length;
        let block =
            text
                .slice(start, end)
                .trim();
        if (!block) {
            continue;
        }
        // ----------------------------------------------------
        // FIND ANSWER
        //
        // Supports:
        // Answer: A
        // Answer: A)
        // Answer: A) Delhi
        // Correct Answer: A
        // ----------------------------------------------------
        let answer = null;
        const answerMatch =
            block.match(
                /(?:Answer|Correct\s*Answer)\s*:\s*([A-D])(?:\s*\)|\s|$)/i
            );
        if (answerMatch) {
            answer =
                answerMatch[1].toUpperCase();
            block =
                block
                    .slice(
                        0,
                        answerMatch.index
                    )
                    .trim();
        }
        // ----------------------------------------------------
        // FIND OPTIONS
        // ----------------------------------------------------
        const optionRegex =
            /(?:^|\s)([A-D])\)\s*(.*?)(?=\s+[A-D]\)\s+|$)/gs;
        const options = {};
        let optionMatch;
        while (
            (optionMatch =
                optionRegex.exec(block)) !== null
        ) {
            const letter =
                optionMatch[1].toUpperCase();
            const value =
                optionMatch[2].trim();
            if (value) {
                options[letter] = value;
            }
        }
        // ----------------------------------------------------
        // Need at least two options
        // ----------------------------------------------------
        if (
            Object.keys(options).length < 2
        ) {
            continue;
        }
        // ----------------------------------------------------
        // FIND QUESTION TEXT
        // ----------------------------------------------------
        const firstOption =
            block.search(
                /(?:^|\s)[A-D]\)\s+/i
            );
        let question = '';
        if (firstOption >= 0) {
            question =
                block
                    .slice(
                        0,
                        firstOption
                    )
                    .trim();
        } else {
            question =
                block.trim();
        }
        if (!question) {
            continue;
        }
        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------
        output.push({
            id:
                starts[i].number,
            question:
                question,
            options:
                options,
            answer:
                answer
        });
    }
    return output;
}
// ============================================================
// ENCODE TEST
// ============================================================
//
// Current format:
//
// u + encodeURIComponent(JSON)
//
// Example:
//
// #t=u%7B%22v%22%3A1...%7D
//
// ============================================================
export function encodeTest(obj) {
    try {
        const json =
            JSON.stringify(obj);
        if (!json) {
            throw new Error(
                'Unable to convert test data.'
            );
        }
        return (
            'u' +
            encodeURIComponent(json)
        );
    } catch (error) {
        console.error(
            'Encoding error:',
            error
        );
        throw error;
    }
}
// ============================================================
// DECODE TEST
// ============================================================
//
// Supports:
//
// u%7B%22v%22%3A1...%7D
//
// Also accepts:
// u%257B...  (double encoded)
//
// Also supports old g compressed links
// through decodeTestAsync().
// ============================================================
export function decodeTest(token) {
    if (!token) {
        return null;
    }
    try {
        token =
            String(token).trim();
        // ----------------------------------------------------
        // CURRENT "u" FORMAT
        // ----------------------------------------------------
        if (
            token.charAt(0) === 'u'
        ) {
            let encoded =
                token.slice(1);
            if (!encoded) {
                return null;
            }
            // ------------------------------------------------
            // Decode once
            // ------------------------------------------------
            let json =
                decodeURIComponent(
                    encoded
                );
            // ------------------------------------------------
            // Handle accidental double encoding
            // ------------------------------------------------
            if (
                json.charAt(0) !== '{' &&
                json.charAt(0) !== '['
            ) {
                try {
                    json =
                        decodeURIComponent(
                            json
                        );
                } catch (e) {
                    // Keep original decoded value
                }
            }
            const data =
                JSON.parse(json);
            // ------------------------------------------------
            // Validate
            // ------------------------------------------------
            if (
                !data ||
                typeof data !== 'object'
            ) {
                throw new Error(
                    'Decoded test is not an object.'
                );
            }
            if (
                !Array.isArray(
                    data.questions
                )
            ) {
                throw new Error(
                    'Test contains no questions.'
                );
            }
            if (
                data.questions.length === 0
            ) {
                throw new Error(
                    'Test contains zero questions.'
                );
            }
            return data;
        }
        // ----------------------------------------------------
        // OLD COMPRESSED FORMAT
        // ----------------------------------------------------
        if (
            token.charAt(0) === 'g'
        ) {
            console.warn(
                'Old compressed link detected. ' +
                'Use decodeTestAsync() for g-links.'
            );
            return null;
        }
        console.error(
            'Unknown test token format.'
        );
        return null;
    } catch (error) {
        console.error(
            'Test decoding error:',
            error
        );
        return null;
    }
}
// ============================================================
// ASYNC DECODE TEST
// ============================================================
//
// Supports both:
// u = current format
// g = old gzip format
//
// ============================================================
export async function decodeTestAsync(token) {
    if (!token) {
        return null;
    }
    token =
        String(token).trim();
    // --------------------------------------------------------
    // Current format
    // --------------------------------------------------------
    if (
        token.charAt(0) === 'u'
    ) {
        return decodeTest(token);
    }
    // --------------------------------------------------------
    // Old compressed format
    // --------------------------------------------------------
    if (
        token.charAt(0) === 'g'
    ) {
        try {
            if (
                typeof DecompressionStream ===
                'undefined'
            ) {
                throw new Error(
                    'This browser does not support compressed test links.'
                );
            }
            const bytes =
                b64ToBytes(
                    token.slice(1)
                );
            const ds =
                new DecompressionStream(
                    'gzip'
                );
            const writer =
                ds.writable.getWriter();
            await writer.write(bytes);
            await writer.close();
            const buffer =
                await new Response(
                    ds.readable
                ).arrayBuffer();
            const json =
                new TextDecoder()
                    .decode(buffer);
            const data =
                JSON.parse(json);
            if (
                !data ||
                !Array.isArray(
                    data.questions
                )
            ) {
                return null;
            }
            return data;
        } catch (error) {
            console.error(
                'Compressed test decoding error:',
                error
            );
            return null;
        }
    }
    return null;
}
// ============================================================
// BASE64 DECODER
// ============================================================
function b64ToBytes(str) {
    str =
        String(str)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
    while (
        str.length % 4
    ) {
        str += '=';
    }
    const binary =
        atob(str);
    const bytes =
        new Uint8Array(
            binary.length
        );
    for (
        let i = 0;
        i < binary.length;
        i++
    ) {
        bytes[i] =
            binary.charCodeAt(i);
    }
    return bytes;
}
// ============================================================
// GET TEST TOKEN FROM URL
// ============================================================
//
// Supports:
//
// test.html#t=xxxxx
//
// test.html?t=xxxxx
//
// ============================================================
export function tokenFromUrl() {
    // --------------------------------------------------------
    // HASH
    // --------------------------------------------------------
    const hash =
        window.location.hash || '';
    if (
        hash.startsWith('#t=')
    ) {
        return hash.slice(3);
    }
    // --------------------------------------------------------
    // QUERY STRING
    // --------------------------------------------------------
    const params =
        new URLSearchParams(
            window.location.search
        );
    return params.get('t');
}
// ============================================================
// TIMER FORMAT
// ============================================================
export function fmt(sec) {
    sec =
        Math.max(
            0,
            Math.floor(
                Number(sec) || 0
            )
        );
    const minutes =
        Math.floor(sec / 60);
    const seconds =
        sec % 60;
    return (
        String(minutes)
            .padStart(2, '0')
        +
        ':'
        +
        String(seconds)
            .padStart(2, '0')
    );
}
