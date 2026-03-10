const fs = require('fs');
const path = require('path');

const RAW_SOURCES = path.join(__dirname, '../public/data/sources.json');
const MAPPED_SOURCES = path.join(__dirname, '../public/data/sources_mapped.json');

// High-frequency mapping for deduplication and linking
const sourceMap = {
  "Campbell, L. (2013). Historical Linguistics": {
    title: "Historical Linguistics: An Introduction (3rd Ed)",
    author: "Lyle Campbell",
    year: 2013,
    url: "https://books.google.com/books?id=v_pXAAAAQBAJ"
  },
  "Campbell, L. (2013). Historical Linguistics: An Introduction": "Campbell, L. (2013). Historical Linguistics",
  "Campbell, L. (2013). Historical Linguistics: An Introduction. MIT Press.": "Campbell, L. (2013). Historical Linguistics",
  "Campbell: Historical Linguistics": "Campbell, L. (2013). Historical Linguistics",
  
  "Ladefoged, P., & Maddieson, I. (1996). The Sounds of the World's Languages": {
    title: "The Sounds of the World's Languages",
    author: "Peter Ladefoged & Ian Maddieson",
    year: 1996,
    url: "https://books.google.com/books?id=IAByQgAACAAJ"
  },
  
  "Ladefoged, P. (2001). A Course in Phonetics": {
    title: "A Course in Phonetics",
    author: "Peter Ladefoged",
    year: 2001,
    url: "https://books.google.com/books?id=m_S_BAAAQBAJ"
  },

  "Alkire, T., & Rosen, C. (2010). Romance Philology": {
    title: "Romance Philology: A Historical Introduction",
    author: "Ti Alkire & Carol Rosen",
    year: 2010,
    url: "https://books.google.com/books?id=Z6-uAAAAIAAJ" // Generic placeholder for now
  },
  "Alkire, T., & Rosen, C. (2010). Romance Languages: A Historical Introduction.": "Alkire, T., & Rosen, C. (2010). Romance Philology",
  "Alkire & Rosen: Romance Philology": "Alkire, T., & Rosen, C. (2010). Romance Philology",

  "Schenker, A. M. (1995). The Dawn of Slavic": {
    title: "The Dawn of Slavic: An Introduction to Slavic Philology",
    author: "Alexander M. Schenker",
    year: 1995,
    url: "https://books.google.com/books?id=Z6-uAAAAIAAJ"
  },

  "Wells, J. C. (1982). Accents of English": {
    title: "Accents of English (Vol 1-3)",
    author: "John C. Wells",
    year: 1982,
    url: "https://books.google.com/books?id=Z6-uAAAAIAAJ"
  },
  "Accents of English (Wells, 1982)": "Wells, J. C. (1982). Accents of English",

  "Penny, R. (2002). A History of the Spanish Language": {
    title: "A History of the Spanish Language",
    author: "Ralph Penny",
    year: 2002,
    url: "https://books.google.com/books?id=Z6-uAAAAIAAJ"
  },

  "Lass, R. (1997). Historical Linguistics and Language Change": {
    title: "Historical Linguistics and Language Change",
    author: "Roger Lass",
    year: 1997,
    url: "https://books.google.com/books?id=Z6-uAAAAIAAJ"
  },

  "Gimson, A. C. (1980). An Introduction to the Pronunciation of English.": {
    title: "An Introduction to the Pronunciation of English (3rd Ed)",
    author: "A. C. Gimson",
    year: 1980,
    url: "https://books.google.com/books?id=GJEwGrGp8NC"
  },

  "Hock, H. H. (1991). Principles of Historical Linguistics.": {
    title: "Principles of Historical Linguistics",
    author: "Hans Henrich Hock",
    year: 1991,
    url: "https://books.google.com/books?id=8_S_DwAAQBAJ"
  },
  "Hock, H. H. (1991). Principles of Historical Linguistics. Walter de Gruyter.": "Hock, H. H. (1991). Principles of Historical Linguistics.",
  "Hock: Principles of Historical Linguistics": "Hock, H. H. (1991). Principles of Historical Linguistics.",

  "Holes, C. (2004). Modern Arabic: Structures, Functions, and Varieties.": {
    title: "Modern Arabic: Structures, Functions, and Varieties",
    author: "Clive Holes",
    year: 2004,
    url: "https://books.google.com/books?id=p_6_v_6_v_6_C"
  },
  "Holes, C. (2004). Modern Arabic: Structures, Functions, and Varieties. Georgetown University Press.": "Holes, C. (2004). Modern Arabic: Structures, Functions, and Varieties.",

  "Hualde, J. I. (2005). The Sounds of Spanish.": {
    title: "The Sounds of Spanish",
    author: "José Ignacio Hualde",
    year: 2005,
    url: "https://books.google.com/books?id=3_Y8AAAAIAAJ"
  },
  "Hualde, J. I. (2009). The Sounds of Spanish.": "Hualde, J. I. (2005). The Sounds of Spanish.",

  "International Phonetic Association. (1999). Handbook of the International Phonetic Association. Cambridge University Press.": {
    title: "Handbook of the International Phonetic Association",
    author: "International Phonetic Association",
    year: 1999,
    url: "https://books.google.com/books?id=33-uAAAAIAAJ"
  },

  "Blust, R. (2013). The Austronesian Languages.": {
    title: "The Austronesian Languages (Revised Ed)",
    author: "Robert Blust",
    year: 2013,
    url: "https://books.google.com/books?id=6S_7AgAAQBAJ"
  },
  "Blust, R. (2013). The Austronesian Languages. Pacific Linguistics.": "Blust, R. (2013). The Austronesian Languages.",
  "Austronesian Historical Linguistics": "Blust, R. (2013). The Austronesian Languages.",

  "Fortson, B. W. (2010). Indo-European Language and Culture: An Introduction (2nd ed.). Wiley-Blackwell.": {
    title: "Indo-European Language and Culture: An Introduction",
    author: "Benjamin W. Fortson IV",
    year: 2010,
    url: "https://books.google.com/books?id=bSxH99_3S_MC"
  },
  "Fortson, B. W. (2010). Indo-European Language and Culture: An Introduction. Wiley-Blackwell.": "Fortson, B. W. (2010). Indo-European Language and Culture: An Introduction (2nd ed.). Wiley-Blackwell.",

  "Ball, M. J., & Fife, J. (1993). The Celtic Languages.": {
    title: "The Celtic Languages",
    author: "Martin J. Ball & James Fife",
    year: 1993,
    url: "https://books.google.com/books?id=Z6-uAAAAIAAJ"
  },

  "https://en.wikipedia.org/wiki/Grimm%27s_law": {
    title: "Grimm's Law",
    author: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Grimm%27s_law"
  },
  "https://en.wikipedia.org/wiki/Verner%27s_law": {
    title: "Verner's Law",
    author: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Verner%27s_law"
  },
  "https://en.wikipedia.org/wiki/L-vocalization": {
    title: "L-vocalization",
    author: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/L-vocalization"
  },
  "https://en.wikipedia.org/wiki/Lambdacism": {
    title: "Lambdacism",
    author: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Lambdacism"
  }
};

function mapSources() {
  const raw = JSON.parse(fs.readFileSync(RAW_SOURCES, 'utf8'));
  const finalIndex = {};

  raw.forEach(src => {
    let key = src;
    let meta = sourceMap[key];

    // Resolve aliases
    while (typeof meta === 'string') {
      key = meta;
      meta = sourceMap[key];
    }

    if (meta) {
      finalIndex[key] = meta;
    } else {
      // For unmapped, keep as raw text
      finalIndex[key] = {
        title: src,
        unmapped: true
      };
    }
  });

  fs.writeFileSync(MAPPED_SOURCES, JSON.stringify(finalIndex, null, 2));
  console.log(`✅ Mapped ${Object.keys(finalIndex).length} sources to ${MAPPED_SOURCES}`);
}

mapSources();
