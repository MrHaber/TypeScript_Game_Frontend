import { Download, ShieldCheck, TimerReset } from 'lucide-react';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { Player, Screen } from '../types';

type ParentControlsScreenProps = {
  player: Player;
  onNavigate: (screen: Screen) => void;
  requireExportApproval: boolean;
  onToggleExportApproval: (value: boolean) => void;
};

export function ParentControlsScreen({
  player,
  onNavigate,
  requireExportApproval,
  onToggleExportApproval,
}: ParentControlsScreenProps) {
  return (
    <main className="screen">
      <Header title="Родителю" player={player} onNavigate={onNavigate} showBack showProfile={false} />

      <section className="parentGrid">
        <Card className="parentCard">
          <ShieldCheck size={34} />
          <h2>Безопасный режим</h2>
          <p>Публикация и отправка рисунков в соцсети требуют подтверждения взрослого.</p>
          <label className="toggleRow">
            <span>Подтверждать экспорт</span>
            <input
              type="checkbox"
              checked={requireExportApproval}
              onChange={(event) => onToggleExportApproval(event.target.checked)}
            />
          </label>
        </Card>

        <Card className="parentCard">
          <TimerReset size={34} />
          <h2>Дневной прогресс</h2>
          <p>Сегодня собрано {player.dayStars}/3 звезды до повышения уровня.</p>
          <div className="levelTrack">
            <div className="levelFill" style={{ width: `${Math.min(100, (player.dayStars / 3) * 100)}%` }} />
          </div>
        </Card>

        <Card className="parentCard">
          <Download size={34} />
          <h2>Архив работ</h2>
          <p>Здесь будет выгрузка всех рисунков ребенка и журнал полученных наград.</p>
          <button className="iconTextButton" type="button">
            <Download size={22} />
            Экспорт
          </button>
        </Card>
      </section>
    </main>
  );
}
