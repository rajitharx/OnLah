import { betaLabel } from '../../shared/version';
import { ITEM_KINDS, ROADMAP_STATUSES, features, releases, roadmap } from './releases';

interface ReleaseNotesViewProps {
  version: string;
}

export function ReleaseNotesView({ version }: ReleaseNotesViewProps) {
  return (
    <section className="view notes" aria-labelledby="notes-title">
      <h1 className="view-title" id="notes-title">
        Release notes
      </h1>
      <p className="notes-version">
        This build: <strong>{betaLabel(version)}</strong>. Release notes cover up to <strong>{releases[0].version}</strong>.
      </p>
      <p className="notes-summary">
        The build number rises with every change. The release history lists milestones only, so its newest version can trail the build.
      </p>

      <section className="notes-section" aria-labelledby="notes-features">
        <h2 className="notes-heading" id="notes-features">
          What OnLah does
        </h2>
        <ul className="notes-list">
          {features.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </section>

      <section className="notes-section" aria-labelledby="notes-history">
        <h2 className="notes-heading" id="notes-history">
          Release history
        </h2>
        <ol className="notes-releases">
          {releases.map((release) => (
            <li key={release.version} className="notes-release">
              <h3 className="notes-release-title">
                <span className="notes-release-version">{release.version}</span> {release.title}
              </h3>
              <p className="notes-summary">{release.summary}</p>
              <ul className="notes-items">
                {release.items.map((item) => (
                  <li key={item.text}>
                    <span className={`notes-kind ${ITEM_KINDS[item.kind].className}`}>{ITEM_KINDS[item.kind].label}</span>{' '}
                    {item.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="notes-section" aria-labelledby="notes-roadmap">
        <h2 className="notes-heading" id="notes-roadmap">
          Roadmap
        </h2>
        {ROADMAP_STATUSES.map(({ status, label, blurb }) => (
          <div key={status} className="notes-group">
            <h3 className="notes-group-title">{label}</h3>
            <p className="notes-summary">{blurb}</p>
            <ul className="notes-list">
              {roadmap
                .filter((item) => item.status === status)
                .map((item) => (
                  <li key={item.text}>{item.text}</li>
                ))}
            </ul>
          </div>
        ))}
      </section>
    </section>
  );
}
