import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="page empty-state">
      <h1>Nie ma takiej strony</h1>
      <Link to="/" className="btn btn-primary">
        Wróć do projektów
      </Link>
    </div>
  );
}
