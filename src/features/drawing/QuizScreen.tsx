import { Check, HelpCircle, Play, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { QuizPack } from './quizData';
import type { Stage } from './types';

type QuizResult = {
  correct: number;
  total: number;
  snapshot: string;
};

type QuizScreenProps = {
  activeStage?: Stage;
  childName: string;
  gameStarted: boolean;
  pack: QuizPack;
  readyForReview: boolean;
  onFinish: (result: QuizResult) => void;
  onShowHelp: () => void;
};

function resultSnapshot(childName: string, pack: QuizPack, answers: number[]) {
  const width = 1200;
  const height = 820;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return '';

  const correct = pack.questions.reduce((sum, question, index) => sum + (answers[index] === question.correctIndex ? 1 : 0), 0);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#eeeaff';
  context.fillRect(0, 0, width, 180);
  context.fillStyle = '#765fde';
  context.beginPath();
  context.roundRect(70, 54, 116, 84, 28);
  context.fill();
  context.fillStyle = '#ffffff';
  context.font = '900 42px Arial';
  context.fillText(`${correct}/${pack.questions.length}`, 92, 108);
  context.fillStyle = '#25253d';
  context.font = '900 52px Arial';
  context.fillText('Результат викторины', 220, 92);
  context.font = '800 30px Arial';
  context.fillStyle = '#71728a';
  context.fillText(`${childName} · ${pack.title}`, 220, 136);

  context.font = '800 25px Arial';
  pack.questions.forEach((question, index) => {
    const y = 235 + index * 68;
    const ok = answers[index] === question.correctIndex;
    context.fillStyle = ok ? '#e9f8df' : '#ffeeee';
    context.beginPath();
    context.roundRect(70, y - 38, 1060, 52, 18);
    context.fill();
    context.fillStyle = ok ? '#327c16' : '#d5260e';
    context.fillText(ok ? 'Верно' : 'Ошибка', 94, y - 4);
    context.fillStyle = '#25253d';
    context.fillText(question.prompt.slice(0, 70), 210, y - 4);
  });

  return canvas.toDataURL('image/png');
}

export function QuizScreen({ activeStage, childName, gameStarted, pack, readyForReview, onFinish, onShowHelp }: QuizScreenProps) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const currentIndex = Math.min(answers.length, pack.questions.length - 1);
  const current = pack.questions[currentIndex];
  const correctCount = useMemo(
    () => pack.questions.reduce((sum, question, index) => sum + (answers[index] === question.correctIndex ? 1 : 0), 0),
    [answers, pack.questions],
  );
  const complete = answers.length >= pack.questions.length;

  function choose(index: number) {
    if (!gameStarted || readyForReview || submitted || complete) return;
    setAnswers((currentAnswers) => [...currentAnswers, index]);
  }

  function finish() {
    const snapshot = resultSnapshot(childName, pack, answers);
    setSubmitted(true);
    onFinish({ correct: correctCount, total: pack.questions.length, snapshot });
  }

  return (
    <section className="quizLayout">
      <section className="quizPanel">
        <div className="taskBubble">
          <span>
            <Trophy size={20} />
          </span>
          <div>
            <p>{childName}, викторина</p>
            <strong>{pack.title}</strong>
          </div>
          <button className="roundHelp" type="button" aria-label="Помощь" onClick={onShowHelp}>
            <HelpCircle size={22} />
          </button>
        </div>

        <div className="quizCard">
          {activeStage?.src && <img className="quizThemeArt" src={activeStage.src} alt={activeStage.title} />}
          {!gameStarted && (
            <div className="softOverlay">
              <Play size={34} />
              <span>Родитель скоро начнет викторину</span>
            </div>
          )}
          {readyForReview || submitted ? (
            <div className="quizDone">
              <Check size={42} />
              <h2>Ответы отправлены</h2>
              <p>
                Верных ответов: {correctCount} из {pack.questions.length}. Родитель скоро проверит результат.
              </p>
            </div>
          ) : complete ? (
            <div className="quizDone">
              <Trophy size={42} />
              <h2>Викторина завершена</h2>
              <p>
                Верных ответов: {correctCount} из {pack.questions.length}.
              </p>
              <button className="primaryButton" type="button" onClick={finish}>
                Отправить результат
              </button>
            </div>
          ) : (
            <div className="questionBlock">
              <div className="questionProgress">
                <span>
                  Вопрос {currentIndex + 1} из {pack.questions.length}
                </span>
                <strong>{Math.round((answers.length / pack.questions.length) * 100)}%</strong>
              </div>
              <h1>{current.prompt}</h1>
              <div className="answerGrid">
                {current.options.map((option, index) => (
                  <button key={option} type="button" onClick={() => choose(index)} disabled={!gameStarted}>
                    <span>{index + 1}</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
