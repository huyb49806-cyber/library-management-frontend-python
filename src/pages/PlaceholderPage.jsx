export default function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MODULE</div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
      </div>
      <section className="panel empty-module">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </section>
    </div>
  )
}
