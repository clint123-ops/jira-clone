import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { downloadExport, parseImport } from '../dataTransfer';
import { useClickOutside } from '../hooks/useClickOutside';
import { createSampleData } from '../sample';
import { useStore } from '../store';
import { useUi } from '../uiStore';
import { DatabaseIcon } from './Icons';

export function DataMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const replaceData = useStore((s) => s.replaceData);
  const showToast = useUi((s) => s.showToast);
  const navigate = useNavigate();

  const handleExport = () => {
    const { projects, issues, members } = useStore.getState();
    downloadExport({ projects, issues, members });
    setOpen(false);
  };

  const handleFile = async (file: File) => {
    try {
      const data = parseImport(await file.text());
      const ok = window.confirm(
        `Zaimportować ${data.projects.length} projekt(y) i ${data.issues.length} zadań?\n\nObecne dane zostaną zastąpione.`,
      );
      if (!ok) return;
      replaceData(data);
      navigate('/');
      showToast('Zaimportowano dane.');
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Nie udało się zaimportować pliku.');
    }
  };

  const handleSample = () => {
    setOpen(false);
    if (!window.confirm('Zastąpić wszystkie dane przykładowymi? Obecne dane zostaną utracone.')) return;
    replaceData(createSampleData());
    navigate('/');
    showToast('Wczytano przykładowe dane.');
  };

  const handleClear = () => {
    setOpen(false);
    if (!window.confirm('Usunąć wszystkie projekty, zadania i członków zespołu? Tej operacji nie można cofnąć.')) {
      return;
    }
    replaceData({ projects: [], issues: [], members: [] });
    navigate('/');
    showToast('Usunięto wszystkie dane.');
  };

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="btn btn-subtle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <DatabaseIcon /> <span className="btn-label">Dane</span>
      </button>
      {open && (
        <div className="dropdown-menu dropdown-menu-right">
          <button type="button" className="dropdown-item" onClick={handleExport}>
            Eksportuj do JSON
          </button>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              setOpen(false);
              fileInput.current?.click();
            }}
          >
            Importuj z JSON…
          </button>
          <div className="dropdown-separator" />
          <button type="button" className="dropdown-item" onClick={handleSample}>
            Wczytaj przykładowe dane
          </button>
          <button type="button" className="dropdown-item is-danger" onClick={handleClear}>
            Usuń wszystkie dane
          </button>
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
