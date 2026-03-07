# PhonoMorph

**The Universal Atlas of Phonetic Evolution**

PhonoMorph is an interactive, open-source dashboard built for linguistics enthusiasts, language learners, and academic discussions. It visualizes and explains how individual speech sounds (phonemes) mutate and evolve across human languages through history.

## Features

- **Interactive Sound Matrix**: A clickable, cross-referenced table of the International Phonetic Alphabet (IPA).
- **Transformation Insights**: Detailed explanations of phonetic effects, such as lenition, palatalization, and debuccalization.
- **Academic Rigor**: Documented shifts are backed by deep research via Google Scholar, Google Books, and CyberLeninka.
- **Unattested Tracking**: Distinguishes between missing data and researched pairs where no regular shift was found (indicated by "X").
- **Matrix Modes**: Specialized viewing modes for Symmetric, Vowel-to-Consonant, and Consonant-to-Vowel shifts.
- **Real-World Examples**: Showcases historical language shifts (e.g., Semitic, Germanic, Romance).
- **Deep-Linkable Views**: Every transformation has a unique URL, making it perfect for citing in linguistic research.

## Architecture

PhonoMorph uses a **GitHub-as-Database** model:
- **Manifest**: `public/data/index.json` tracks all registered symbols and transformations.
- **Cells**: Each documented shift is a standalone JSON file in `public/data/transformations/`.
- **Static Hosting**: Designed for optimized performance on GitHub Pages using React and Hash Routing.

## Development

PhonoMorph is built with **React**, **TypeScript**, and **Vite**.

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

## Community Contributions

PhonoMorph is intended to be a growing atlas. If you have examples of phonetic transformations, references, or corrections, contributions are highly encouraged!
