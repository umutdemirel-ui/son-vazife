import { useState } from 'react';
import { Check, FilePenLine, Search } from 'lucide-react';
import { DELIVERY_FILES } from '../game/registry';
import type { AutopsyCaseState } from '../game/types';
import { MenuDialog } from './MenuDialog';

export function DeliveryRegister({
  entry,
  onSubmit,
  onInspect,
  onClose,
}: {
  entry: AutopsyCaseState;
  onSubmit: (answers: string[]) => boolean;
  onInspect: () => void;
  onClose: () => void;
}) {
  const file = DELIVERY_FILES[entry.id];
  const [answers, setAnswers] = useState(['', '']);
  const [error, setError] = useState(false);
  return (
    <MenuDialog
      title="Cenaze kabul defteri"
      kicker={`GASİLHANE / DOSYA ${file.number}`}
      onClose={onClose}
      wide
    >
      <div className="case-register">
        <div className="case-documents">
          <p className="document-id">
            DOSYADAKİ BELGELER <span>2 EK</span>
          </p>
          {file.documents.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <form
          className="case-fields"
          onSubmit={(e) => {
            e.preventDefault();
            setError(!onSubmit(answers));
          }}
        >
          <p className="panel-index">TESLİM KAYDI / {file.number}</p>
          <h3>{entry.victimName}</h3>
          {entry.completed ? (
            <p className="file-sealed">
              <Check size={16} />
              Bu dosya mühürlendi.
            </p>
          ) : (
            <>
              <p>Evrakları karşılaştır. Yalnızca doğrulayabildiğin bilgileri deftere geçir.</p>
              {file.fields.map((field, i) => (
                <label key={field.label}>
                  {field.label}
                  <select
                    required
                    value={answers[i]}
                    onChange={(e) => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      setAnswers(next);
                      setError(false);
                    }}
                  >
                    <option value="">Seç…</option>
                    {field.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
              {error && (
                <p role="alert" className="file-feedback">
                  Kaydın belgelerle uyuşmuyor. İki evrağı yeniden karşılaştır.
                </p>
              )}
              <button type="submit" className="menu-button primary" disabled={answers.includes('')}>
                <FilePenLine size={16} />
                Kaydı mühürle
              </button>
            </>
          )}
        </form>
      </div>
      <footer className="case-bottom">
        <span>{entry.locationLabel}</span>
        <button onClick={onInspect} className="text-action">
          <Search size={14} />
          Adli inceleme tezgâhını aç
        </button>
      </footer>
    </MenuDialog>
  );
}
