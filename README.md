# EchoDrift

**The Universal Atlas of Phonetic Evolution**

EchoDrift is an interactive, open-source dashboard built for linguistics enthusiasts, language learners, and academic discussions. It visualizes and explains how individual speech sounds (phonemes) mutate and evolve across human languages through history.

## Features

- **Interactive Sound Matrix**: A clickable, cross-referenced table of the International Phonetic Alphabet (IPA).
- **Transformation Insights**: Detailed explanations of phonetic effects, such as lenition, palatalization, and debuccalization.
- **Inverse Detection**: Automatically detects and shows paths to inverse transformations (e.g., if A→B is documented, the B→A cell provides a direct link).
- **Phonetic Effect Labels**: Matrix cells display the primary shift name (e.g., "Raising", "Lenition") and commonality (1-5 dots) at a glance.
- **Academic Rigor**: Documented shifts are backed by deep research via Google Scholar, Google Books, and CyberLeninka.
- **Unattested Tracking**: Distinguishes between missing data and researched pairs where no regular shift was found (indicated by "X").
- **Matrix Modes**: Specialized viewing modes for Symmetric, Vowel-to-Consonant, and Consonant-to-Vowel shifts.
- **Real-World Examples**: Showcases historical language shifts (e.g., Semitic, Germanic, Romance).
- **Deep-Linkable Views**: Every transformation has a unique URL, making it perfect for citing in linguistic research.

## Architecture

EchoDrift uses a **GitHub-as-Database** model:
- **Manifest**: `public/data/index.json` tracks all registered symbols and transformations, including bundled metadata for ultra-fast initial matrix rendering.
- **Cells**: Each documented shift is a standalone JSON file in `public/data/transformations/`.
- **Static Hosting**: Designed for optimized performance on GitHub Pages using React and Hash Routing.

## Development

EchoDrift is built with **React**, **TypeScript**, and **Vite**.

### Automated Indexing

The project uses a custom script to bundle transformation metadata into the main manifest. This is handled automatically during development and build:

```bash
# Manually rebuild the data index
npm run rebuild-index
```

### Running Locally

```bash
# Install dependencies
npm install

# Start development server (auto-rebuilds index)
npm run dev
```

### Building for Production

```bash
# Build and bundle for production
npm run build
```

## Agent Skills

EchoDrift includes a specialized **Gemini CLI skill** to assist with linguistic research and data population.

- **Skill Name**: `echodrift-researcher`
- **Location**: `.gemini/skills/echodrift-researcher/`
- **Purpose**: Automates the search for historical sound shifts using Google Scholar/CyberLeninka and ensures new data adheres to the strict project schema.

To activate the skill in your Gemini session:
```bash
gemini skill activate echodrift-researcher
```

## Community Contributions

EchoDrift is intended to be a growing atlas. If you have examples of phonetic transformations, references, or corrections, contributions are highly encouraged!
