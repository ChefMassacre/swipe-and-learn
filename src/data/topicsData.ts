// Topic content. Each card points at a Wikipedia article. Its picture comes
// from that article, cleaned of giveaway names and approved by a person
// (see docs/IMAGES.md). `blurb` is our own short summary shown after a reveal.
// To add a topic: add an entry to TOPICS. See docs/CONTENT.md.
// This file has no imports so the image scripts in scripts/images can read it.
// The app imports src/data/topics.ts, which hides cards without an approved image.

export type Card = {
  id: string;
  /** The answer shown on the back of the card. */
  answer: string;
  /** Extra accepted spellings for "type it" mode. */
  aliases?: string[];
  /** Wikipedia article title, used for the image and the "Learn more" link. */
  wiki: string;
  /** One or two sentences shown after the reveal. */
  blurb: string;
  /** Optional hint shown on the front, e.g. a decade. */
  hint?: string;
};

export type Topic = {
  id: string;
  title: string;
  emoji: string;
  categoryId: string;
  /** Question shown on the front of every card. */
  prompt: string;
  description: string;
  /** Free users can play free topics; the rest need Plus. */
  free: boolean;
  /** Ids of similar topics in other categories; drawn as links on the Explore map. */
  related?: string[];
  cards: Card[];
};

export type Category = { id: string; title: string; color: string };

export const CATEGORIES: Category[] = [
  { id: 'pop', title: 'Pop Culture', color: '#F43F5E' },
  { id: 'tech', title: 'Tech & Games', color: '#6C4DF6' },
  { id: 'ideas', title: 'History & Ideas', color: '#0EA5E9' },
  { id: 'trades', title: 'Trades & Tools', color: '#F59E0B' },
  { id: 'style', title: 'Style & Materials', color: '#10B981' },
  { id: 'sports', title: 'Sports', color: '#EF4444' },
];

const c = (id: string, answer: string, wiki: string, blurb: string, extra: Partial<Card> = {}): Card => ({
  id, answer, wiki, blurb, ...extra,
});

const TOPICS: Topic[] = [
  {
    id: 'consoles',
    related: ['movies', 'brands'],
    title: 'Game Consoles',
    emoji: '🎮',
    categoryId: 'tech',
    prompt: 'Which console is this?',
    description: 'From cartridges to cloud saves: name the machines that defined gaming.',
    free: true,
    cards: [
      c('consoles-nes', 'Nintendo Entertainment System', 'Nintendo Entertainment System', "Nintendo's 1985 North American release that revived home gaming after the 1983 crash.", { aliases: ['NES'] }),
      c('consoles-snes', 'Super Nintendo', 'Super Nintendo Entertainment System', 'The 16-bit follow-up to the NES (1991 in North America), home of Super Mario World.', { aliases: ['SNES', 'Super Nintendo Entertainment System'] }),
      c('consoles-genesis', 'Sega Genesis', 'Sega Genesis', "Sega's 16-bit console, called Mega Drive outside North America, famous for Sonic the Hedgehog.", { aliases: ['Mega Drive', 'Genesis'] }),
      c('consoles-n64', 'Nintendo 64', 'Nintendo 64', "Nintendo's 1996 console with a three-pronged controller and Super Mario 64.", { aliases: ['N64'] }),
      c('consoles-ps1', 'PlayStation', 'PlayStation (console)', "Sony's first console (1994), which made CD-based games mainstream.", { aliases: ['PS1', 'PSX', 'PlayStation 1'] }),
      c('consoles-ps2', 'PlayStation 2', 'PlayStation 2', 'The best-selling home console of all time, with roughly 160 million units sold.', { aliases: ['PS2'] }),
      c('consoles-gamecube', 'GameCube', 'GameCube', "Nintendo's compact 2001 console that used small optical discs and had a carry handle.", { aliases: ['Nintendo GameCube'] }),
      c('consoles-xbox', 'Xbox', 'Xbox (console)', "Microsoft's first console (2001), launched alongside Halo: Combat Evolved.", { aliases: ['Original Xbox'] }),
      c('consoles-wii', 'Wii', 'Wii', 'Nintendo\'s 2006 motion-control console that brought families into gaming with Wii Sports.', { aliases: ['Nintendo Wii'] }),
      c('consoles-switch', 'Nintendo Switch', 'Nintendo Switch', 'A 2017 hybrid that works both docked to a TV and as a handheld.', { aliases: ['Switch'] }),
      c('consoles-gameboy', 'Game Boy', 'Game Boy', "Nintendo's 1989 handheld; Tetris was packed in with it in North America.", { aliases: ['Gameboy'] }),
    ],
  },
  {
    id: 'philosophers',
    related: ['celebs'],
    title: 'Philosophers',
    emoji: '🏛️',
    categoryId: 'ideas',
    prompt: 'Who is this philosopher?',
    description: 'Put faces to the big ideas, from ancient Athens to the 20th century.',
    free: true,
    cards: [
      c('phil-socrates', 'Socrates', 'Socrates', 'Athenian who wrote nothing down; known through Plato for relentless questioning (the Socratic method).'),
      c('phil-plato', 'Plato', 'Plato', "Socrates' student who founded the Academy and wrote The Republic, with its theory of Forms."),
      c('phil-aristotle', 'Aristotle', 'Aristotle', "Plato's student and Alexander the Great's tutor, who wrote on logic, ethics, biology, and politics."),
      c('phil-confucius', 'Confucius', 'Confucius', 'Chinese thinker (551–479 BC) whose teachings on virtue, family, and government shaped East Asia.'),
      c('phil-descartes', 'René Descartes', 'René Descartes', 'French philosopher famous for "I think, therefore I am" and for Cartesian coordinates.', { aliases: ['Descartes'] }),
      c('phil-kant', 'Immanuel Kant', 'Immanuel Kant', 'German philosopher of the Critique of Pure Reason and the categorical imperative.', { aliases: ['Kant'] }),
      c('phil-nietzsche', 'Friedrich Nietzsche', 'Friedrich Nietzsche', 'German philosopher who wrote "God is dead" and the idea of the Übermensch. Recognisable by his huge moustache.', { aliases: ['Nietzsche'] }),
      c('phil-marx', 'Karl Marx', 'Karl Marx', 'Co-author of The Communist Manifesto and author of Das Kapital.', { aliases: ['Marx'] }),
      c('phil-beauvoir', 'Simone de Beauvoir', 'Simone de Beauvoir', 'French existentialist who wrote The Second Sex, a founding text of modern feminism.', { aliases: ['de Beauvoir', 'Beauvoir'] }),
      c('phil-sartre', 'Jean-Paul Sartre', 'Jean-Paul Sartre', 'French existentialist ("existence precedes essence") who declined the 1964 Nobel Prize in Literature.', { aliases: ['Sartre'] }),
    ],
  },
  {
    id: 'construction',
    related: ['tools', 'materials'],
    title: 'Construction Equipment',
    emoji: '🚜',
    categoryId: 'trades',
    prompt: 'What is this machine called?',
    description: 'Know your dozer from your backhoe next time you pass a building site.',
    free: true,
    cards: [
      c('con-excavator', 'Excavator', 'Excavator', 'A boom, stick, and bucket on a rotating cab, used for digging trenches and foundations.', { aliases: ['Digger'] }),
      c('con-bulldozer', 'Bulldozer', 'Bulldozer', 'A tracked tractor with a wide front blade for pushing soil, sand, and rubble.', { aliases: ['Dozer'] }),
      c('con-backhoe', 'Backhoe loader', 'Backhoe loader', 'A tractor with a loader bucket on the front and a small digging arm (backhoe) on the back.', { aliases: ['Backhoe'] }),
      c('con-skidsteer', 'Skid-steer loader', 'Skid-steer loader', 'A small, nimble loader that turns by skidding its wheels; often called a Bobcat.', { aliases: ['Skid steer', 'Bobcat'] }),
      c('con-towercrane', 'Tower crane', 'Tower crane', 'The tall fixed cranes on skyscraper sites, with a horizontal jib and counterweight.'),
      c('con-grader', 'Motor grader', 'Grader', 'A long machine with a mid-mounted blade used to create flat surfaces, especially roads.', { aliases: ['Grader', 'Road grader'] }),
      c('con-roller', 'Road roller', 'Road roller', 'Compacts soil, gravel, or asphalt with heavy smooth drums.', { aliases: ['Steamroller', 'Roller', 'Compactor'] }),
      c('con-dumptruck', 'Dump truck', 'Dump truck', 'A truck whose bed tips up hydraulically to unload material.', { aliases: ['Tipper truck', 'Tipper'] }),
      c('con-mixer', 'Concrete mixer truck', 'Concrete mixer', 'A truck with a rotating drum that keeps concrete mixed on the way to the site.', { aliases: ['Cement mixer', 'Concrete mixer', 'Cement truck'] }),
      c('con-telehandler', 'Telehandler', 'Telescopic handler', 'A forklift-like machine with a telescoping boom for lifting loads high and far.', { aliases: ['Telescopic handler'] }),
    ],
  },
  {
    id: 'fabrics',
    related: ['brands', 'materials'],
    title: 'Clothing Materials',
    emoji: '🧵',
    categoryId: 'style',
    prompt: 'What material is this?',
    description: 'Read a clothing tag like a pro: the fibers and weaves behind what you wear.',
    free: false,
    cards: [
      c('fab-denim', 'Denim', 'Denim', 'A sturdy cotton twill, usually with indigo-dyed warp threads; the fabric of jeans.'),
      c('fab-silk', 'Silk', 'Silk', 'A natural protein fiber spun by silkworms, prized for its sheen and smoothness.'),
      c('fab-wool', 'Wool', 'Wool', 'Fiber from sheep (and goats, alpacas and more) that insulates even when damp.'),
      c('fab-linen', 'Linen', 'Linen', 'Made from flax; cool, breathable, and quick to wrinkle.'),
      c('fab-velvet', 'Velvet', 'Velvet', 'A woven fabric with a short, dense pile that gives it a soft, rich feel.'),
      c('fab-corduroy', 'Corduroy', 'Corduroy', 'Cotton fabric with raised parallel cords called "wales".'),
      c('fab-tweed', 'Tweed', 'Tweed', 'A rough, woolen fabric originally from Scotland, often in checks or herringbone.'),
      c('fab-leather', 'Leather', 'Leather', 'Tanned animal hide, used for jackets, shoes, and bags.'),
      c('fab-polyester', 'Polyester', 'Polyester', 'A synthetic fiber made from petroleum; durable, wrinkle-resistant, and cheap.'),
      c('fab-cashmere', 'Cashmere', 'Cashmere wool', 'An extremely soft, warm fiber combed from cashmere goats.', { aliases: ['Cashmere wool'] }),
    ],
  },
  {
    id: 'tools',
    related: ['materials'],
    title: 'Hand Tools',
    emoji: '🔧',
    categoryId: 'trades',
    prompt: 'What tool is this?',
    description: 'From the basic toolbox to the specialist kit.',
    free: false,
    cards: [
      c('tool-claw', 'Claw hammer', 'Claw hammer', 'A hammer with a curved, split back for pulling nails.', { aliases: ['Hammer'] }),
      c('tool-adjwrench', 'Adjustable spanner', 'Adjustable spanner', 'A wrench with a jaw that slides open to fit different nut sizes.', { aliases: ['Adjustable wrench', 'Crescent wrench'] }),
      c('tool-pliers', 'Pliers', 'Pliers', 'Hand tool with two levers for gripping, bending, and cutting wire.'),
      c('tool-chisel', 'Chisel', 'Chisel', 'A blade with a beveled edge, struck or pushed to carve wood, stone, or metal.'),
      c('tool-handsaw', 'Hand saw', 'Hand saw', 'A toothed blade with a handle for cutting wood by hand.', { aliases: ['Handsaw', 'Saw'] }),
      c('tool-level', 'Spirit level', 'Spirit level', 'Uses an air bubble in a liquid vial to show if a surface is perfectly horizontal or vertical.', { aliases: ['Level', 'Bubble level'] }),
      c('tool-tapemeasure', 'Tape measure', 'Tape measure', 'A flexible ruler that retracts into a case.', { aliases: ['Measuring tape'] }),
      c('tool-hacksaw', 'Hacksaw', 'Hacksaw', 'A fine-toothed saw in a C-shaped frame, for cutting metal and plastic.'),
      c('tool-plane', 'Hand plane', 'Hand plane', 'A blade set in a block, pushed along wood to shave and flatten it.', { aliases: ['Plane', 'Wood plane'] }),
      c('tool-vise', 'Vise', 'Vise (tool)', 'A clamp bolted to a workbench that holds a piece steady while you work on it.', { aliases: ['Vice', 'Bench vise'] }),
    ],
  },
  // Coming soon: shown on the map so users can see where the app is going.
  { id: 'celebs', related: ['movies', 'sports'], title: 'Modern Celebrities', emoji: '⭐', categoryId: 'pop', prompt: 'Who is this?', description: 'Coming soon.', free: false, cards: [] },
  { id: 'movies', title: 'Movies', emoji: '🎬', categoryId: 'pop', prompt: 'Which movie is this?', description: 'Coming soon.', free: false, cards: [] },
  { id: 'brands', title: 'Brands & Logos', emoji: '🏷️', categoryId: 'pop', prompt: 'Which brand is this?', description: 'Coming soon.', free: false, cards: [] },
  { id: 'sports', related: ['brands'], title: 'Sports', emoji: '🏀', categoryId: 'sports', prompt: 'Which sport is this?', description: 'Coming soon.', free: false, cards: [] },
  { id: 'materials', title: 'Building Materials', emoji: '🧱', categoryId: 'trades', prompt: 'What material is this?', description: 'Coming soon.', free: false, cards: [] },
];

export const RAW_TOPICS = TOPICS;
