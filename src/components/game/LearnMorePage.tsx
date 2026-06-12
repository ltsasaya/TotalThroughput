interface LearnMorePageProps {
  onClose: () => void
}

export function LearnMorePage({ onClose }: LearnMorePageProps) {
  return (
    <section
      className="retro-manual-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Learn more"
    >
      <div className="retro-manual-shell retro-manual-shell-modal">
        <article className="retro-manual-page">
          <header className="retro-manual-header">
            <h1>Learn More</h1>
          </header>

          <div className="retro-manual-content">
            <div className="retro-manual-copy">
              <p>More content coming.</p>
            </div>
          </div>

          <footer className="retro-manual-footer">
            <div />
            <div />
            <button
              type="button"
              className="retro-manual-button retro-manual-button-primary"
              onClick={onClose}
            >
              Close
            </button>
          </footer>
        </article>
      </div>
    </section>
  )
}
