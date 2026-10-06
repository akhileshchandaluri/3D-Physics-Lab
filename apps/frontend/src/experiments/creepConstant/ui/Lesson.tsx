import { useState, type FormEvent } from 'react'
import styles from '../App.module.css'

export type LessonId =
  | 'aim'
  | 'theory'
  | 'pretest'
  | 'procedure'
  | 'simulation'
  | 'posttest'
  | 'references'
  | 'feedback'

const ITEMS: { id: LessonId; label: string }[] = [
  { id: 'aim', label: 'Aim' },
  { id: 'theory', label: 'Theory' },
  { id: 'pretest', label: 'Pretest' },
  { id: 'procedure', label: 'Procedure' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'posttest', label: 'Posttest' },
  { id: 'references', label: 'References' },
  { id: 'feedback', label: 'Feedback' },
]

interface LessonMenuProps {
  current: LessonId
  onSelect: (id: LessonId) => void
}

export function LessonMenu({ current, onSelect }: LessonMenuProps) {
  return (
    <nav className={styles.menu} aria-label="Lesson sections">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === current ? styles.menuOn : undefined}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

interface Question {
  prompt: string
  choices: { text: string; correct?: boolean; why: string }[]
}

const PRETEST: Question[] = [
  {
    prompt: 'What is creep?',
    choices: [
      { text: 'The wire gets longer slowly while the same weight stays on it.', correct: true, why: 'That slow extra length, under a steady weight, is creep.' },
      { text: 'The wire springs back the moment the weight is taken off.', why: 'Springing back is elastic. Creep is the slow stretch that happens while the weight is still on.' },
      { text: 'The watch running faster than the clock on the wall.', why: 'The watch only keeps time. Creep is a change in the wire.' },
      { text: 'The metal changing colour when it is heated.', why: 'This experiment is about length, not colour.' },
    ],
  },
  {
    prompt: 'What is l₀?',
    choices: [
      { text: 'The length of the wire at the moment you press Start. It stays fixed for the whole run.', correct: true, why: 'l₀ is the starting length. Later lengths are compared with it.' },
      { text: 'The length after the wire has broken.', why: 'The broken length is the end of the run. l₀ is the length at Start.' },
      { text: 'The weight, written in grams.', why: 'The weight is the load. l₀ is a length.' },
      { text: 'The height of the stand.', why: 'The stand does not change. l₀ is the wire.' },
    ],
  },
  {
    prompt: 'What does β tell you?',
    choices: [
      { text: 'How fast the wire stretches in the early minutes, while that stretch is slowing down.', correct: true, why: 'β is the early creep. It is large at first and then settles.' },
      { text: 'How heavy the hanger is.', why: 'The hanger’s weight is the load. β describes the stretch, not the weight.' },
      { text: 'How warm the room is.', why: 'Temperature is not what β measures.' },
      { text: 'The length of the wire after it snaps.', why: 'The snap is the end. β describes the early, slowing stretch.' },
    ],
  },
  {
    prompt: 'What happens if the weight is heavier than the metal can safely hold?',
    choices: [
      { text: 'The wire snaps at once.', correct: true, why: 'Above the safe load, the wire does not wait. It breaks immediately.' },
      { text: 'Nothing changes.', why: 'A load that is too heavy does change the wire. It breaks it.' },
      { text: 'The clock stops and the wire stays the same length.', why: 'The clock is only a timer. The wire itself fails.' },
      { text: 'The wire gets shorter.', why: 'A heavy load lengthens a wire. It does not shorten it.' },
    ],
  },
]

const POSTTEST: Question[] = [
  {
    prompt: 'Which graph gives β?',
    choices: [
      { text: 'Extra length divided by the starting length, plotted against time to the power 1/3. The slope is β.', correct: true, why: 'That early graph is Δl/l₀ against t to the power 1/3. Its slope is β.' },
      { text: 'Extra length divided by the length now, plotted against time.', why: 'That second graph gives k, not β.' },
      { text: 'Weight plotted against the warmth of the room.', why: 'Neither axis is the weight or the room temperature.' },
      { text: 'Watch time plotted against the time on a wall clock.', why: 'The graphs use the wire’s length, not two clocks.' },
    ],
  },
  {
    prompt: 'Which graph gives k?',
    choices: [
      { text: 'Extra length divided by the length now, plotted against time. The slope is k.', correct: true, why: 'That graph is Δl/lₜ against time. Its slope is k, the steady creep.' },
      { text: 'The early graph that gives β.', why: 'The early graph gives β. k comes from the graph against ordinary time.' },
      { text: 'Stress plotted against how stiff the metal is.', why: 'Stiffness is Young’s modulus. k is a slope from the length readings.' },
      { text: 'The list of parts on the bench.', why: 'The parts only set up the experiment. k comes from the readings.' },
    ],
  },
  {
    prompt: 'Why are readings after 21 minutes left out when the slopes are worked out?',
    choices: [
      { text: 'The wire starts stretching faster as it nears breaking, so those late points would spoil the steady slope.', correct: true, why: 'The last part of the half hour speeds up. The slopes use only the first 21 minutes.' },
      { text: 'The watch cannot count past 21 minutes.', why: 'The watch runs to 30 minutes. The 21 minute cut is only for the slope.' },
      { text: 'The table has room for only a few rows.', why: 'The table can hold every reading. The cut is about the science, not the paper.' },
      { text: 'The metal cools down after 21 minutes.', why: 'The load stays the same. The late stretch speeds up because the wire is nearing failure.' },
    ],
  },
  {
    prompt: 'For soldering lead with a 200 g weight, when does the wire break?',
    choices: [
      { text: 'At about 31 percent extra length, when the lab clock reaches 30 minutes.', correct: true, why: 'That is the workbook case: 200 g of soldering lead reaches about 31 percent extra length at 30 minutes, then snaps.' },
      { text: 'The moment Start is pressed.', why: 'Start only begins the slow stretch. The break comes at the end of the half hour.' },
      { text: 'Only if you press Lap.', why: 'Lap writes a reading. The wire breaks on its own when the stretch is large enough.' },
      { text: 'After the weight is taken off.', why: 'The weight stays on. The wire breaks while it is still loaded.' },
    ],
  },
]

export function LessonReading({ section }: { section: Exclude<LessonId, 'simulation'> }) {
  if (section === 'aim') return <Aim />
  if (section === 'theory') return <Theory />
  if (section === 'pretest') return <Quiz title="Pretest" lead="Answer these before you start. A wrong choice explains itself. You can still open the simulation." questions={PRETEST} />
  if (section === 'procedure') return <Procedure />
  if (section === 'posttest') return <Quiz title="Posttest" lead="Answer these after you have read the graphs. A wrong choice explains itself." questions={POSTTEST} />
  if (section === 'references') return <References />
  return <Feedback />
}

function Aim() {
  return (
    <article className={styles.reading}>
      <h2>Aim</h2>
      <p>
        Hang a steady weight on a metal wire and find two numbers.
      </p>
      <p>
        <strong>β</strong> (beta) says how fast the wire stretches in the early minutes.
        That early stretch starts quickly and then slows down.
      </p>
      <p>
        <strong>k</strong> says how steadily the wire keeps stretching after that early part.
      </p>
    </article>
  )
}

function Theory() {
  return (
    <article className={styles.reading}>
      <h2>Theory</h2>
      <p>
        Put a weight on a wire and it stretches at once. Leave the same weight there, and the wire keeps growing, slowly. That slow growth is called creep.
      </p>
      <p>
        <strong>l₀</strong> is the length of the wire at the moment you press Start. It is frozen. Every later reading is compared with this length.
      </p>
      <p>
        <strong>Δl</strong> (delta l) is the extra length that comes from creep. It does not include the stretch that happened the instant the weight went on.
      </p>
      <p>
        <strong>lₜ</strong> is the length now. It is the original length, plus the instant stretch, plus the creep.
      </p>
      <p>
        Two graphs are drawn from the readings.
      </p>
      <ol>
        <li>The first graph plots Δl/l₀ against time to the power 1/3. Time to the power 1/3 means the cube root of the time. The slope of this graph is β.</li>
        <li>The second graph plots Δl/lₜ against ordinary time. The slope of this graph is k.</li>
      </ol>
      <p>
        Only the first 21 minutes are used for those slopes. After that the wire stretches faster, because it is getting close to breaking. Those late points would pull the slope off the steady part. The graphs themselves still show every reading, including the bend and the break.
      </p>
      <p>
        Soldering lead with a 200 g weight reaches about 31 percent extra length when the lab clock shows 30 minutes, and then the wire snaps. The weights fall onto the bench.
      </p>
      <p>
        If the weight is heavier than that metal can safely hold, the wire does not creep. It snaps at once.
      </p>
    </article>
  )
}

function Procedure() {
  return (
    <article className={styles.reading}>
      <h2>Procedure</h2>
      <ol>
        <li>Open Simulation. Pick up each part from the list and place it on the stand, in the order the page asks for.</li>
        <li>Hang a wire from the clamp. The workbook metal is soldering lead.</li>
        <li>Add the 200 g weight. Leave it there. The weight must stay steady.</li>
        <li>Press Start on the watch. The length at that moment is l₀. It will not change.</li>
        <li>Let the clock run. The picture of the wire is drawn larger than life so you can see a tiny stretch. The numbers in the table stay the true length in centimetres.</li>
        <li>Read the two graphs. Automatic writes a reading every 3 seconds of lab time, up to 30 minutes or until the wire breaks. By hand waits until you press Lap on the watch.</li>
      </ol>
      <p>
        A 30 minute experiment can be finished in a few seconds of your own time. The watch still shows lab minutes, not the seconds on your phone.
      </p>
    </article>
  )
}

function References() {
  return (
    <article className={styles.reading}>
      <h2>References</h2>
      <ol>
        <li>
          Andrade, E. N. da C. (1910). On the viscous flow in metals, and allied phenomena. Proceedings of the Royal Society.
          This is the note that describes the early stretch, the part we call β.
        </li>
        <li>
          A first-year book on the strength of materials. Read the chapter on creep. It explains a steady load, the slow extra length, and why a wire can break after a long time even though the weight never changed.
        </li>
      </ol>
    </article>
  )
}

function Quiz({ title, lead, questions }: { title: string; lead: string; questions: Question[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({})

  return (
    <article className={styles.reading}>
      <h2>{title}</h2>
      <p>{lead}</p>
      <ol className={styles.quiz}>
        {questions.map((question, questionIndex) => {
          const choice = picked[questionIndex]
          const selected = choice == null ? null : question.choices[choice]
          return (
            <li key={question.prompt}>
              <p>{question.prompt}</p>
              <div className={styles.quizChoices}>
                {question.choices.map((option, optionIndex) => {
                  const selectedThis = choice === optionIndex
                  const mark = selectedThis
                    ? option.correct ? styles.quizRight : styles.quizWrong
                    : undefined
                  return (
                    <button
                      key={option.text}
                      type="button"
                      className={mark}
                      onClick={() => setPicked((current) => ({ ...current, [questionIndex]: optionIndex }))}
                    >
                      {option.text}
                    </button>
                  )
                })}
              </div>
              {selected ? <p className={styles.quizWhy}>{selected.why}</p> : null}
            </li>
          )
        })}
      </ol>
    </article>
  )
}

function Feedback() {
  const [sent, setSent] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <article className={styles.reading}>
        <h2>Feedback</h2>
        <p>Thank you. Your note stays on this page only. It is not saved.</p>
      </article>
    )
  }

  return (
    <article className={styles.reading}>
      <h2>Feedback</h2>
      <p>Tell us what helped, and what was hard to follow.</p>
      <form className={styles.feedback} onSubmit={submit}>
        <label>
          What was clear?
          <textarea name="clear" rows={3} />
        </label>
        <label>
          What was hard?
          <textarea name="hard" rows={3} />
        </label>
        <label>
          Anything else?
          <textarea name="note" rows={3} />
        </label>
        <button type="submit">Send</button>
      </form>
    </article>
  )
}
