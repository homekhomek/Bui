import { t } from './translate.js';
import { LAYOUT } from './data.js';

export default function App() {
  return (
    <div className="min-h-full flex items-center justify-center bg-white text-dusk">
      <main
        className="w-full flex flex-col items-center justify-center gap-4 p-4 text-center"
        style={{ maxWidth: LAYOUT.maxWidth }}
      >
        <h1 className="text-5xl">{t('title')}</h1>
        <p className="text-lg text-slate">{t('subtitle')}</p>
        <button className="px-6 py-2 rounded bg-rose text-dusk hover:bg-dusty">{t('start')}</button>
      </main>
    </div>
  );
}
