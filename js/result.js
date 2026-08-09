// ============================================================
// RESULT.JS
// Student Result Page
// GitHub Pages
// No Firebase
// No Server
// ============================================================
import { esc, fmt } from './common.js';

const r = JSON.parse(sessionStorage.getItem('mockResult') || 'null');

if (!r) {
    result.innerHTML =
        '<h1>No result found</h1><p>Please complete a test first.</p>';
} else {
    renderResult();
    renderReview('all');
}

// ============================================================
// RENDER SCORE HEADER
// ============================================================
function renderResult() {
    const grade =
        r.percent >= 90
            ? 'Excellent'
            : r.percent >= 75
            ? 'Very Good'
            : r.percent >= 60
            ? 'Good'
            : r.percent >= 40
            ? 'Needs Improvement'
            : 'Keep Practicing';
    const scoreLine =
        r.negativeMarking
            ? r.rawScore + ' / ' + r.total
            : r.correct + ' / ' + r.total;
    result.innerHTML =
        '<div class="resultHeader">' +
        '<div class="trophy">🏆</div>' +
        '<h1>Test Completed</h1>' +
        '<h2>' + esc(r.title) + '</h2>' +
        '<p>' + esc(r.name) +
        (r.roll ? ' • Roll No. ' + esc(r.roll) : '') +
        '</p>' +
        '</div>' +
        '<div class="score">' +
        scoreLine +
        '<small>' + r.percent + '%</small>' +
        '</div>' +
        (
            r.negativeMarking
                ? '<p class="successText">Negative marking: -' +
                  r.negativeMarking +
                  ' per wrong answer applied.</p>'
                : ''
        ) +
        '<div class="stats">' +
        '<div><b>' + r.correct + '</b><span>Correct</span></div>' +
        '<div><b>' + r.wrong + '</b><span>Wrong</span></div>' +
        '<div><b>' + r.unanswered + '</b><span>Unattempted</span></div>' +
        '<div><b>' + fmt(r.timeTaken) + '</b><span>Time Taken</span></div>' +
        '</div>' +
        '<h2>' + grade + '</h2>' +
        '<div class="actions">' +
        '<button id="share">📤 Share Result</button>' +
        '<button onclick="window.print()">🖨️ Print / Save</button>' +
        '</div>';
    const text =
        '📝 ' + r.title +
        '\n👤 ' + r.name +
        (r.roll ? '\n🎫 Roll No: ' + r.roll : '') +
        '\n🏆 Score: ' + scoreLine + ' (' + r.percent + '%)' +
        '\n✅ Correct: ' + r.correct +
        '\n❌ Wrong: ' + r.wrong +
        '\n⚪ Unattempted: ' + r.unanswered +
        '\n⏱️ Time: ' + fmt(r.timeTaken);
    document.getElementById('share').onclick = async function () {
        if (navigator.share) {
            await navigator.share({ title: r.title, text });
        } else {
            try {
                await navigator.clipboard.writeText(text);
                alert('Result copied. Paste it into WhatsApp.');
            } catch (error) {
                alert(text);
            }
        }
    };
}

// ============================================================
// RENDER ANSWER REVIEW (with filter)
// ============================================================
const markedSet = new Set((r && r.marked) || []);

function classify(q) {
    const chosen = r.answers[q.id];
    if (markedSet.has(String(q.id))) {
        return 'marked';
    }
    if (!chosen) {
        return 'unanswered';
    }
    return chosen === q.answer ? 'correct' : 'wrong';
}

function renderReview(filter) {
    const filters = [
        ['all', 'All'],
        ['wrong', 'Wrong'],
        ['correct', 'Correct'],
        ['unanswered', 'Unattempted'],
        ['marked', 'Marked']
    ];
    const filterRow =
        '<div class="filterRow">' +
        filters
            .map(
                ([key, label]) =>
                    '<button type="button" class="filterBtn' +
                    (key === filter ? ' active' : '') +
                    '" data-filter="' + key + '">' +
                    label +
                    '</button>'
            )
            .join('') +
        '</div>';
    const visible =
        filter === 'all'
            ? r.questions
            : r.questions.filter(function (q) {
                  return classify(q) === filter;
              });
    const cards =
        visible.length === 0
            ? '<p>No questions in this filter.</p>'
            : visible
                  .map(function (q) {
                      const chosen = r.answers[q.id];
                      const ok = chosen === q.answer;
                      const isMarked = markedSet.has(String(q.id));
                      return (
                          '<article class="card review ' +
                          (ok ? 'right' : 'wrong') +
                          '">' +
                          (isMarked ? '<span>🚩 Marked for review</span><br>' : '') +
                          '<b>' + q.id + '. ' + esc(q.question) + '</b>' +
                          '<p>Your answer: ' +
                          (
                              chosen
                                  ? esc(chosen + ') ' + q.options[chosen])
                                  : 'Not answered'
                          ) +
                          '</p>' +
                          '<p>Correct answer: <b>' +
                          esc(q.answer + ') ' + (q.options[q.answer] || '')) +
                          '</b></p>' +
                          '</article>'
                      );
                  })
                  .join('');
    review.innerHTML =
        '<h2>Answer Review</h2>' + filterRow + cards;
    review.querySelectorAll('.filterBtn').forEach(function (btn) {
        btn.onclick = function () {
            renderReview(btn.dataset.filter);
        };
    });
}
