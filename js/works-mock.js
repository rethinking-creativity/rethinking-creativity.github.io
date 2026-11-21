// Works shown on the QR page (work.html?id=...). PROTOTYPE: four sample works, the same as the example cards.
// Later this file alone is replaced by the backend client; work.js only calls WorksAPI.get(id)
// and expects a work object (fields below, the same names the submit form sends) or null.
//   medium: text | image | video | sound      credit: name | anon      process: [{ step, by_hand, with_ai }], 1-5 steps the person names
//   materials: museum-label line, e.g. "Monotype print"   description: printed on the card   description_long: QR page only
//   src: image, video or audio file   poster: video still   art: sound artwork   text: full text   link: external link
(function () {
  const WORKS = {
    kettle: {
      medium: 'text', title: 'Kettle', credit: 'anon', name: '', year: '2026', materials: 'Poem',
      text: 'The kettle learns my name each morning.\nIt calls twice, and I come home.\nThe radiator answers in its own slow code,\nthree knocks, a sigh, then nothing.\nThe fridge hums the one note it remembers.\n\nI set out a cup for no one,\nthen drink from it myself.\nSomewhere a neighbour’s door says goodnight.\nI count the small voices of the house\nuntil the quiet has a shape,\nand the shape is almost company.',
      description: 'A short poem about living alone and the small sounds that keep me company.',
      description_long: 'I moved into a flat on my own last winter and started noticing how much the house talks. The poem is a list of those voices, and of the habits I picked up to answer them. It is meant to be read slowly, out loud if you can.',
      process: [
        { step: 'First line', by_hand: 'A line said half-asleep', with_ai: '' },
        { step: 'Drafting', by_hand: 'Wrote it on the bus', with_ai: 'ChatGPT endings, unused' },
        { step: 'Tighten', by_hand: 'Cut it to two stanzas', with_ai: 'ChatGPT rhythm check' },
      ],
      process_long: 'The first line came to me half-asleep and the rest on a bus ride. I asked ChatGPT for ten possible endings; I used none of them, but reading them showed me what the poem should not say. Later I pasted the draft back in and asked where the rhythm stumbled. It pointed at two lines, and I rewrote them myself.',
    },
    underwater: {
      // A real work by Hye-Young: only facts she confirmed
      medium: 'image', title: 'Underwater', credit: 'name', name: 'Hye-Young Jo', year: '2026', materials: 'Monotype, oil-based ink on paper',
      src: 'assets/examples/underwater_full.jpg',
      description: 'An abstract take on a sea filled with plastic.',
      description_long: '',
      process: [
        { step: 'Roll', by_hand: 'Blue-to-white gradient', with_ai: '' },
        { step: 'Texture', by_hand: 'Cloth, bubble wrap, mesh', with_ai: '' },
        { step: 'Glove', by_hand: 'Rolled red and black ink', with_ai: '' },
        { step: 'Press', by_hand: 'Laid it on top, pressed', with_ai: '' },
      ],
      process_long: 'I loved getting my hands dirty, the play that comes up along the way, and knowing there is only one of each print.',
    },
    tram: {
      medium: 'video', title: 'Tram at Dusk', credit: 'name', name: 'Sam Rivera', year: '2026', materials: 'Video',
      src: 'assets/works/ai_tram.mp4', poster: 'assets/examples/tram_frame.jpg',
      description: 'A short scene of a city tram, built from my grandfather’s photos of the line he rode to work.',
      description_long: 'My grandfather rode the same tram line to work for thirty years. Only a handful of his photos of it survive, all still and slightly blurred. I wanted to see the line move, at the hour he used to come home.',
      process: [
        { step: 'Archive', by_hand: 'Gathered his tram photos', with_ai: '' },
        { step: 'Plan', by_hand: 'Wrote the shot list', with_ai: '' },
        { step: 'Generate', by_hand: 'Picked 3 clips', with_ai: 'Generated 8 Veo clips' },
        { step: 'Edit', by_hand: 'Cut and color graded', with_ai: '' },
      ],
      process_long: 'I wrote a shot list from his photos and generated eight clips with Veo. Most looked like any city; I kept the three that felt like his line. The cut, the timing and the colour grade are mine, done by hand.',
    },
    nocturne: {
      medium: 'sound', title: 'Nocturne for a Rainy Night', credit: 'anon', name: '', year: '2026', materials: 'Audio',
      src: 'assets/works/ai_nocturne.mp3', art: 'assets/examples/sound_radial.svg',
      description: 'A short piano nocturne for late, rainy evenings.',
      description_long: 'Written for the hour when the rain is loud enough to cover the city. It is short on purpose: one idea, played quietly, then left alone.',
      process: [
        { step: 'Melody', by_hand: 'Hummed the opening', with_ai: '' },
        { step: 'Variations', by_hand: 'Kept one with a new turn', with_ai: '20 variations with Lyria' },
        { step: 'Piano', by_hand: 'Played piano over one', with_ai: '' },
        { step: 'Mix', by_hand: 'Mixed by ear', with_ai: '' },
      ],
      process_long: 'I hummed the opening into my phone and gave the melody to Lyria, which returned twenty variations. One of them had a turn I would not have tried. I learned it, played the piano part myself over that variation, and mixed the two by ear.',
    },
  };
  window.WorksAPI = {
    async get(id) {
      const w = Object.prototype.hasOwnProperty.call(WORKS, id) ? WORKS[id] : null;
      return w ? { id, ...w } : null;
    },
  };
})();
