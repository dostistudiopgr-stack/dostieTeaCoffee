import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'var(--color-cream)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(5rem, 15vw, 9rem)',
          fontWeight: 700,
          color: 'var(--color-primary)',
          lineHeight: 1,
          margin: '0 0 0.5rem',
        }}
      >
        404
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
          color: 'var(--color-text)',
          marginBottom: '0.75rem',
        }}
      >
        Page Not Found
      </p>
      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '1rem',
          maxWidth: '420px',
          lineHeight: 1.6,
          marginBottom: '2.5rem',
        }}
      >
        The page you're looking for doesn't exist or may have been moved.
        Let's get you back to the good stuff.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-white)',
          padding: '0.75rem 2rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: 500,
          fontSize: '0.9375rem',
          letterSpacing: '0.02em',
          textDecoration: 'none',
          transition: 'background-color var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--color-primary-deep)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--color-primary)';
        }}
      >
        Back to Home
      </Link>
    </main>
  );
};

export default NotFound;
