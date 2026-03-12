const About = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>About PhonoMorph</h1>
      
      <section style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          PhonoMorph is a data-dense <strong>Universal Atlas of Phonetic Evolution</strong> designed to visualize and document systematic sound shifts across human languages with scientific rigor and academic evidence.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>The Goal</h2>
        <p>
          Historical linguistics often relies on disparate tables and text-heavy descriptions. PhonoMorph centralizes these observations into an interactive matrix, allowing researchers, students, and language enthusiasts to explore how sounds mutate over time—whether through <em>lenition</em> (weakening), <em>fortition</em> (strengthening), <em>palatalization</em>, or <em>vocalization</em>.
        </p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Methodology</h2>
        <p>
          Every documented shift in this atlas is backed by peer-reviewed research, historical sound laws (such as Grimm's Law, Verner's Law, or Barth's Law), or systematic dialectal observations.
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
          <li><strong>Deep Research:</strong> We utilize Google Scholar, Google Books, and CyberLeninka to identify regular, historical phonetic shifts.</li>
          <li><strong>Unattested Cells:</strong> Pairs marked with an "X" have been researched and determined to lack a regular historical shift, distinguishing them from "missing data."</li>
          <li><strong>Matrix Modes:</strong> The atlas supports Symmetric viewing, as well as Vowel-to-Consonant (v2c) and Consonant-to-Vowel (c2v) modes to capture complex shifts like debuccalization and vocalization.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Data Model</h2>
        <p>
          PhonoMorph uses a <strong>GitHub-as-Database</strong> architecture. Each cell intersection in the matrix corresponds to a unique JSON file containing preamble descriptions, technical phonetic effects, language-specific examples, and scholarly citations.
        </p>
      </section>

      <section style={{ marginBottom: '4rem', padding: '1.5rem', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--success-color)' }}>Contribute</h3>
        <p>
          The atlas is a living document. If you identify a missing transformation or have better academic sources, please reach out to **komapc@gmail.com** or contribute directly via our **[GitHub Repository](https://github.com/komapc/phonomorph)** by clicking any empty cell in the matrix.
        </p>
      </section>
    </div>
  );
};

export default About;
