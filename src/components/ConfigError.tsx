export default function ConfigError({ errors }: { errors: string[] }) {
  return (
    <div className="app">
      <div className="card card--center">
        <h1>⚠️ Configuration error</h1>
        <p>The app can&apos;t start because of a configuration problem:</p>
        <ul className="config-error__list">
          {errors.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>
        <p className="muted">
          Local dev: copy <code>config/config.yaml.example</code> to{' '}
          <code>config/config.yaml</code> and fill it in. Docker: set the{' '}
          <code>AZURE_*</code> environment variables.
        </p>
      </div>
    </div>
  );
}
