import { Helmet } from 'react-helmet-async';

const About = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <Helmet>
        <title>About | EchoDrift — Universal Atlas of Phonetic Evolution</title>
        <meta name="description" content="Learn about EchoDrift's methodology, data model, and quality assurance process for documenting phonetic transformations across human languages." />
        <link rel="canonical" href="https://echodrift.pages.dev/about" />
      </Helmet>
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
          Every documented shift in this atlas is backed by peer-reviewed research, historical sound laws (such as Grimm's Law, Verner's Law, or Barth's Law), or systematic dialectal observations. We employ a multi-layered verification process:
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
          <li><strong>LLM-Assisted Research:</strong> We use language models to systematically search for academic sources on each phonetic shift across diverse language families. Multiple independent queries ensure comprehensive coverage of the phonetic transformation space.</li>
          <li><strong>Cross-Verification:</strong> Each shift is re-verified using independent models and manual linguistic review to confirm historical validity and rule out spurious or implausible transformations.</li>
          <li><strong>Multilingual Documentation:</strong> Examples are drawn from multiple language families and documented in their original forms, with transcriptions standardized to IPA and source languages specified for clarity and reproducibility.</li>
          <li><strong>Deep Research Sources:</strong> We utilize Google Scholar, Google Books, CyberLeninka, JSTOR, and specialized linguistic databases to identify regular, historical phonetic shifts backed by scholarly consensus.</li>
          <li><strong>Unattested Cells:</strong> Pairs marked with an "X" have been researched and determined to lack a regular historical shift, distinguishing them from "missing data."</li>
          <li><strong>Matrix Modes:</strong> The atlas supports Symmetric viewing, as well as Vowel-to-Consonant (v2c) and Consonant-to-Vowel (c2v) modes to capture complex shifts like debuccalization and vocalization.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Data Model</h2>
        <p>
          PhonoMorph uses a <strong>GitHub-as-Database</strong> architecture. Each cell intersection in the matrix corresponds to a unique JSON file containing:
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
          <li><strong>Preamble:</strong> A concise linguistic explanation of the shift and its phonetic motivation.</li>
          <li><strong>Phonetic Effects:</strong> Standardized process tags (Lenition, Fortition, Palatalization, Assimilation, etc.) for categorical browsing.</li>
          <li><strong>Language Examples:</strong> Documented cases from multiple language families, with native scripts preserved alongside IPA transcriptions for enhanced discoverability and multilingual search.</li>
          <li><strong>Scholarly Citations:</strong> Direct links to peer-reviewed sources, historical references, and academic databases.</li>
          <li><strong>Metadata:</strong> Certainty and commonality ratings, language family tags, and links to related transformations to support discovery and research.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Quality Assurance</h2>
        <p>
          All entries undergo rigorous quality control:
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
          <li><strong>Schema Validation:</strong> Every JSON entry is validated against a strict schema, ensuring consistency and completeness.</li>
          <li><strong>Multi-Model Verification:</strong> Shifts are independently verified by multiple language models to minimize bias and catch errors in source identification or interpretation.</li>
          <li><strong>Manual Linguistic Review:</strong> Phonetic plausibility and historical accuracy are confirmed by manual review against accepted sound change principles.</li>
          <li><strong>Multilingual Indexing:</strong> Examples are indexed in their original languages (English, German, Arabic, etc.) alongside IPA to improve cross-linguistic discoverability and support researchers working in non-English traditions.</li>
        </ul>
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
