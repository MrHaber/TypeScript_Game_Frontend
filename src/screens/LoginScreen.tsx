import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Sparkles, UserPlus } from 'lucide-react';
import { AssetPreview } from '../components/AssetPreview';
import { assetById } from '../data/assetCatalog';

type LoginScreenProps = {
  loading: boolean;
  error: string | null;
  onLogin: (childName: string) => Promise<void>;
  onRegister: (childName: string, parentPin: string) => Promise<void>;
};

export function LoginScreen({ loading, error, onLogin, onRegister }: LoginScreenProps) {
  const [childName, setChildName] = useState('Миша');
  const [parentPin, setParentPin] = useState('1234');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const peopleAsset = assetById('people');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'login') {
      await onLogin(childName.trim());
      return;
    }
    await onRegister(childName.trim(), parentPin.trim());
  }

  return (
    <main className="loginScreen">
      <section className="loginPanel">
        <div className="loginArt">
          <motion.div
            className="loginStar"
            animate={{ rotate: [0, 8, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={48} />
          </motion.div>
          <h1>Учи.ру Рисунки</h1>
          <p>Войди в профиль ребенка, выбирай арт, загружай бумажного героя и получай звезды.</p>
          <div className="loginAssetFrame">
            <AssetPreview asset={peopleAsset} alt="Персонажи Учи.ру" />
          </div>
        </div>

        <form className="loginForm" onSubmit={handleSubmit}>
          <div className="loginTabs">
            <button className={mode === 'login' ? 'activeLoginTab' : ''} type="button" onClick={() => setMode('login')}>
              Вход
            </button>
            <button className={mode === 'register' ? 'activeLoginTab' : ''} type="button" onClick={() => setMode('register')}>
              Регистрация
            </button>
          </div>

          <label>
            Имя ребенка
            <input value={childName} onChange={(event) => setChildName(event.target.value)} placeholder="Например, Миша" />
          </label>

          {mode === 'register' && (
            <label>
              PIN родителя
              <input value={parentPin} onChange={(event) => setParentPin(event.target.value)} placeholder="4 цифры" />
            </label>
          )}

          {error && <p className="formError">{error}</p>}

          <button className="primaryButton largeButton" type="submit" disabled={loading || childName.trim().length < 2}>
            {mode === 'login' ? <LogIn size={24} /> : <UserPlus size={24} />}
            {loading ? 'Подключаемся...' : mode === 'login' ? 'Войти' : 'Создать профиль'}
          </button>
        </form>
      </section>
    </main>
  );
}
