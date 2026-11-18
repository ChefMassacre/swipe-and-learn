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
  /**
   * "Did you know?" shown after the reveal. Only add one when it's genuinely
   * surprising and you're sure it's true. A card with no fact is better than a
   * card with a dull one.
   */
  fact?: string;
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
  /** Skip the AI clean-up step (e.g. flags, which have no giveaway text and must stay exact). */
  keepOriginal?: boolean;
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
  { id: 'world', title: 'World & Places', color: '#14B8A6' },
  { id: 'arts', title: 'Music & Arts', color: '#D946EF' },
  { id: 'nature', title: 'Nature & Animals', color: '#84CC16' },
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
      c('consoles-nes', 'Nintendo Entertainment System', 'Nintendo Entertainment System', "Nintendo's 1985 North American release that revived home gaming after the 1983 crash.", { aliases: ['NES'], fact: "To win over wary US shops after the 1983 crash, Nintendo sold it with R.O.B., a toy robot, so it looked less like a video game." }),
      c('consoles-snes', 'Super Nintendo', 'Super Nintendo Entertainment System', 'The 16-bit follow-up to the NES (1991 in North America), home of Super Mario World.', { aliases: ['SNES', 'Super Nintendo Entertainment System'], fact: "Its sound chip was designed by Ken Kutaragi of Sony, the engineer who went on to create the PlayStation." }),
      c('consoles-genesis', 'Sega Genesis', 'Sega Genesis', "Sega's 16-bit console, called Mega Drive outside North America, famous for Sonic the Hedgehog.", { aliases: ['Mega Drive', 'Genesis'] }),
      c('consoles-n64', 'Nintendo 64', 'Nintendo 64', "Nintendo's 1996 console with a three-pronged controller and Super Mario 64.", { aliases: ['N64'] }),
      c('consoles-ps1', 'PlayStation', 'PlayStation (console)', "Sony's first console (1994), which made CD-based games mainstream.", { aliases: ['PS1', 'PSX', 'PlayStation 1'], fact: "It began as a CD add-on for the Super Nintendo. When Nintendo pulled out of the deal, Sony built its own console instead." }),
      c('consoles-ps2', 'PlayStation 2', 'PlayStation 2', 'The best-selling home console of all time, with roughly 160 million units sold.', { aliases: ['PS2'], fact: "At launch it was one of the cheapest DVD players you could buy, which helped it sell to people who didn't even play games." }),
      c('consoles-gamecube', 'GameCube', 'GameCube', "Nintendo's compact 2001 console that used small optical discs and had a carry handle.", { aliases: ['Nintendo GameCube'] }),
      c('consoles-xbox', 'Xbox', 'Xbox (console)', "Microsoft's first console (2001), launched alongside Halo: Combat Evolved.", { aliases: ['Original Xbox'], fact: "The name is short for \"DirectX Box\", after the Microsoft graphics software it was built around." }),
      c('consoles-wii', 'Wii', 'Wii', 'Nintendo\'s 2006 motion-control console that brought families into gaming with Wii Sports.', { aliases: ['Nintendo Wii'], fact: "So many players flung their remotes into TVs during Wii Sports that Nintendo replaced about 3 million wrist straps with stronger ones." }),
      c('consoles-switch', 'Nintendo Switch', 'Nintendo Switch', 'A 2017 hybrid that works both docked to a TV and as a handheld.', { aliases: ['Switch'], fact: "Switch game cards are coated with a harmless but extremely bitter chemical so that children spit them out." }),
      c('consoles-gameboy', 'Game Boy', 'Game Boy', "Nintendo's 1989 handheld; Tetris was packed in with it in North America.", { aliases: ['Gameboy'], fact: "A Game Boy that was badly burned in a bombing during the 1991 Gulf War still worked, and Nintendo put it on display in New York." }),
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
      c('phil-socrates', 'Socrates', 'Socrates', 'Athenian who wrote nothing down; known through Plato for relentless questioning (the Socratic method).', { fact: "Socrates distrusted writing, saying it would weaken people's memory. We only know that because Plato wrote it down." }),
      c('phil-plato', 'Plato', 'Plato', "Socrates' student who founded the Academy and wrote The Republic, with its theory of Forms.", { fact: "\"Plato\" was probably a nickname meaning \"broad\". His real name may have been Aristocles." }),
      c('phil-aristotle', 'Aristotle', 'Aristotle', "Plato's student and Alexander the Great's tutor, who wrote on logic, ethics, biology, and politics.", { fact: "He thought the brain's job was to cool the blood, and that thinking happened in the heart." }),
      c('phil-confucius', 'Confucius', 'Confucius', 'Chinese thinker (551–479 BC) whose teachings on virtue, family, and government shaped East Asia.', { fact: "\"Confucius\" is a Latin-style name made up by European missionaries from Kong Fuzi, meaning \"Master Kong\"." }),
      c('phil-descartes', 'René Descartes', 'René Descartes', 'French philosopher famous for "I think, therefore I am" and for Cartesian coordinates.', { aliases: ['Descartes'], fact: "He loved lying in bed until late morning. When Queen Christina of Sweden made him teach her at 5 a.m., he caught pneumonia and died within months." }),
      c('phil-kant', 'Immanuel Kant', 'Immanuel Kant', 'German philosopher of the Critique of Pure Reason and the categorical imperative.', { aliases: ['Kant'], fact: "Kant almost never left his home city of Königsberg, and his daily walk was said to be so punctual that neighbours set their clocks by it." }),
      c('phil-nietzsche', 'Friedrich Nietzsche', 'Friedrich Nietzsche', 'German philosopher who wrote "God is dead" and the idea of the Übermensch. Recognisable by his huge moustache.', { aliases: ['Nietzsche'], fact: "He became a university professor at 24, before he had even finished his doctorate." }),
      c('phil-marx', 'Karl Marx', 'Karl Marx', 'Co-author of The Communist Manifesto and author of Das Kapital.', { aliases: ['Marx'], fact: "For about ten years Marx earned money as a London correspondent for the New York Daily Tribune." }),
      c('phil-beauvoir', 'Simone de Beauvoir', 'Simone de Beauvoir', 'French existentialist who wrote The Second Sex, a founding text of modern feminism.', { aliases: ['de Beauvoir', 'Beauvoir'], fact: "She and Jean-Paul Sartre were partners for 51 years but never married and never lived together." }),
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
      c('con-excavator', 'Excavator', 'Excavator', 'A boom, stick, and bucket on a rotating cab, used for digging trenches and foundations.', { aliases: ['Digger'], fact: "The largest land vehicle ever built, Bagger 288, is a giant bucket-wheel excavator weighing about 13,500 tonnes." }),
      c('con-bulldozer', 'Bulldozer', 'Bulldozer', 'A tracked tractor with a wide front blade for pushing soil, sand, and rubble.', { aliases: ['Dozer'], fact: "\"Bulldoze\" meant to bully or threaten someone in the 1870s, decades before it was the name of a machine." }),
      c('con-backhoe', 'Backhoe loader', 'Backhoe loader', 'A tractor with a loader bucket on the front and a small digging arm (backhoe) on the back.', { aliases: ['Backhoe'] }),
      c('con-skidsteer', 'Skid-steer loader', 'Skid-steer loader', 'A small, nimble loader that turns by skidding its wheels; often called a Bobcat.', { aliases: ['Skid steer', 'Bobcat'], fact: "The first one was built in 1957 by two brothers in Minnesota, to help a farmer clean out his turkey barn." }),
      c('con-towercrane', 'Tower crane', 'Tower crane', 'The tall fixed cranes on skyscraper sites, with a horizontal jib and counterweight.', { fact: "Tower cranes make themselves taller: a climbing frame jacks up the top and the crew slots in a new section of tower underneath." }),
      c('con-grader', 'Motor grader', 'Grader', 'A long machine with a mid-mounted blade used to create flat surfaces, especially roads.', { aliases: ['Grader', 'Road grader'] }),
      c('con-roller', 'Road roller', 'Road roller', 'Compacts soil, gravel, or asphalt with heavy smooth drums.', { aliases: ['Steamroller', 'Roller', 'Compactor'], fact: "People still call them steamrollers, even though they have run on diesel for generations." }),
      c('con-dumptruck', 'Dump truck', 'Dump truck', 'A truck whose bed tips up hydraulically to unload material.', { aliases: ['Tipper truck', 'Tipper'], fact: "The biggest mining dump trucks can carry about 450 tonnes in a single load, roughly the weight of a fully loaded jumbo jet." }),
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
      c('fab-denim', 'Denim', 'Denim', 'A sturdy cotton twill, usually with indigo-dyed warp threads; the fabric of jeans.', { fact: "The name comes from \"serge de Nîmes\", a fabric from the city of Nîmes in France." }),
      c('fab-silk', 'Silk', 'Silk', 'A natural protein fiber spun by silkworms, prized for its sheen and smoothness.', { fact: "A silkworm cocoon is one unbroken thread that can be hundreds of metres long, close to a kilometre in the best cases." }),
      c('fab-wool', 'Wool', 'Wool', 'Fiber from sheep (and goats, alpacas and more) that insulates even when damp.', { fact: "Lanolin, the grease that waterproofs sheep's wool, is the main ingredient in many lip balms and skin creams." }),
      c('fab-linen', 'Linen', 'Linen', 'Made from flax; cool, breathable, and quick to wrinkle.', { fact: "Linen is one of the oldest fabrics in the world. Ancient Egyptians wrapped their mummies in it." }),
      c('fab-velvet', 'Velvet', 'Velvet', 'A woven fabric with a short, dense pile that gives it a soft, rich feel.'),
      c('fab-corduroy', 'Corduroy', 'Corduroy', 'Cotton fabric with raised parallel cords called "wales".', { fact: "The story that it comes from the French \"corde du roi\", the king's cord, is almost certainly made up. The word first appears in English." }),
      c('fab-tweed', 'Tweed', 'Tweed', 'A rough, woolen fabric originally from Scotland, often in checks or herringbone.', { fact: "The name may come from a London cloth merchant misreading \"tweel\", the Scots word for twill, as the River Tweed." }),
      c('fab-leather', 'Leather', 'Leather', 'Tanned animal hide, used for jackets, shoes, and bags.'),
      c('fab-polyester', 'Polyester', 'Polyester', 'A synthetic fiber made from petroleum; durable, wrinkle-resistant, and cheap.', { fact: "Most plastic drinks bottles are made of PET, the same polyester that is spun into clothing fibres." }),
      c('fab-cashmere', 'Cashmere', 'Cashmere wool', 'An extremely soft, warm fiber combed from cashmere goats.', { aliases: ['Cashmere wool'], fact: "One goat gives only about 150 grams of cashmere a year, so a single jumper needs the fibre of several goats." }),
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
      c('tool-handsaw', 'Hand saw', 'Hand saw', 'A toothed blade with a handle for cutting wood by hand.', { aliases: ['Handsaw', 'Saw'], fact: "Japanese saws cut when you pull instead of push, which lets the blade be much thinner." }),
      c('tool-level', 'Spirit level', 'Spirit level', 'Uses an air bubble in a liquid vial to show if a surface is perfectly horizontal or vertical.', { aliases: ['Level', 'Bubble level'] }),
      c('tool-tapemeasure', 'Tape measure', 'Tape measure', 'A flexible ruler that retracts into a case.', { aliases: ['Measuring tape'], fact: "The metal hook at the end is loose on purpose. It slides by its own thickness, so both inside and outside measurements come out right." }),
      c('tool-hacksaw', 'Hacksaw', 'Hacksaw', 'A fine-toothed saw in a C-shaped frame, for cutting metal and plastic.'),
      c('tool-plane', 'Hand plane', 'Hand plane', 'A blade set in a block, pushed along wood to shave and flatten it.', { aliases: ['Plane', 'Wood plane'] }),
      c('tool-vise', 'Vise', 'Vise (tool)', 'A clamp bolted to a workbench that holds a piece steady while you work on it.', { aliases: ['Vice', 'Bench vise'] }),
    ],
  },
  {
    id: 'landmarks',
    related: ['flags', 'philosophers', 'materials'],
    title: 'World Landmarks',
    emoji: '🗼',
    categoryId: 'world',
    prompt: 'Which landmark is this?',
    description: 'Famous places you could spot from a postcard, on every continent.',
    free: true,
    cards: [
      c('lm-eiffel', 'Eiffel Tower', 'Eiffel Tower', 'The wrought-iron tower built in Paris for the 1889 World\'s Fair, once meant to stand for only 20 years.', { fact: "It grows about 15 cm taller in summer, as the iron expands in the heat." }),
      c('lm-colosseum', 'Colosseum', 'Colosseum', 'Rome\'s giant stone amphitheatre, opened in AD 80 for gladiator fights and public shows.', { aliases: ['Coliseum', 'Flavian Amphitheatre'] }),
      c('lm-tajmahal', 'Taj Mahal', 'Taj Mahal', 'A white marble tomb in Agra, India, built by the emperor Shah Jahan for his wife Mumtaz Mahal.'),
      c('lm-greatwall', 'Great Wall of China', 'Great Wall of China', 'A chain of walls and forts across northern China, built and rebuilt over some 2,000 years.', { aliases: ['Great Wall'], fact: "Despite the famous claim, you can't see it from the Moon with the naked eye. It's very long but only a few metres wide." }),
      c('lm-machupicchu', 'Machu Picchu', 'Machu Picchu', 'A 15th-century Inca citadel high in the Andes of Peru.'),
      c('lm-liberty', 'Statue of Liberty', 'Statue of Liberty', 'A gift from France to the United States, dedicated in New York Harbor in 1886.', { aliases: ['Lady Liberty'], fact: "It's made of copper and was shiny brown when it arrived. It took about 20 to 30 years to weather to green." }),
      c('lm-operahouse', 'Sydney Opera House', 'Sydney Opera House', 'The sail-roofed performing arts centre on Sydney Harbour, opened in 1973.', { aliases: ['Opera House'], fact: "Its Danish architect, Jørn Utzon, quit halfway through building it and never saw it finished." }),
      c('lm-redeemer', 'Christ the Redeemer', 'Christ the Redeemer (statue)', 'The 30-metre statue of Jesus with open arms on Corcovado mountain above Rio de Janeiro.', { aliases: ['Cristo Redentor'], fact: "It's struck by lightning several times a year, and spare stone is kept on hand to repair its fingers and head." }),
      c('lm-stonehenge', 'Stonehenge', 'Stonehenge', 'A prehistoric ring of standing stones on Salisbury Plain in England, about 5,000 years old.', { fact: "Some of its smaller stones were dragged about 240 km from the Preseli Hills in Wales, about 5,000 years ago." }),
      c('lm-pyramid', 'Great Pyramid of Giza', 'Great Pyramid of Giza', 'The largest of the Egyptian pyramids, built as a tomb for the pharaoh Khufu around 2560 BC.', { aliases: ['Great Pyramid', 'Pyramid of Giza', 'Pyramids of Giza', 'Pyramid of Khufu'], fact: "For about 3,800 years it was the tallest human-made structure on Earth." }),
      c('lm-bigben', 'Big Ben', 'Big Ben', 'The clock tower at the Houses of Parliament in London, finished in 1859.', { aliases: ['Elizabeth Tower'], fact: "Strictly speaking, Big Ben is the name of the great bell inside. The tower itself is called Elizabeth Tower." }),
      c('lm-goldengate', 'Golden Gate Bridge', 'Golden Gate Bridge', 'The suspension bridge across the entrance to San Francisco Bay, opened in 1937.', { fact: "It isn't golden. The colour is called International Orange, chosen so it stands out in the fog." }),
      c('lm-angkor', 'Angkor Wat', 'Angkor Wat', 'A vast 12th-century temple complex in Cambodia, the largest religious monument in the world.', { fact: "It's the only building pictured on a country's national flag: Cambodia's." }),
    ],
  },
  {
    id: 'flags',
    related: ['landmarks', 'sports', 'dogs'],
    title: 'Flags of the World',
    emoji: '🏳️',
    categoryId: 'world',
    prompt: 'Which country flies this flag?',
    description: 'From the easy ones to the ones that catch everyone out at the pub quiz.',
    free: true,
    keepOriginal: true,
    cards: [
      c('flag-japan', 'Japan', 'Flag of Japan', 'A red disc on white, standing for the sun. Japan\'s name means "origin of the sun".'),
      c('flag-canada', 'Canada', 'Flag of Canada', 'A red maple leaf between two red bands.', { fact: "The maple leaf flag is younger than you might think. It only became Canada's official flag in 1965." }),
      c('flag-brazil', 'Brazil', 'Flag of Brazil', 'A blue globe on a yellow diamond, with the motto "Ordem e Progresso" (Order and Progress).', { fact: "The stars show the sky over Rio de Janeiro on the morning of 15 November 1889, the day Brazil became a republic." }),
      c('flag-switzerland', 'Switzerland', 'Flag of Switzerland', 'A white cross on red. The Red Cross symbol is the same flag with the colours swapped.', { fact: "It's one of only two square national flags. The other belongs to Vatican City." }),
      c('flag-nepal', 'Nepal', 'Flag of Nepal', 'Two stacked crimson pennants with a moon and a sun.', { fact: "It's the only national flag in the world that isn't a rectangle." }),
      c('flag-denmark', 'Denmark', 'Flag of Denmark', 'A white Nordic cross on red, called the Dannebrog.', { fact: "It's thought to be the oldest national flag still in use, with records going back to the 1300s." }),
      c('flag-mexico', 'Mexico', 'Flag of Mexico', 'Green, white and red stripes with the national coat of arms in the centre.', { fact: "The eagle eating a snake on a cactus comes from the Aztec legend of how they chose where to build their capital, Tenochtitlan." }),
      c('flag-jamaica', 'Jamaica', 'Flag of Jamaica', 'A gold diagonal cross with green and black triangles.', { fact: "It's the only national flag that uses none of red, white or blue." }),
      c('flag-southkorea', 'South Korea', 'Flag of South Korea', 'A red and blue yin-yang circle on white, with four black trigrams.', { aliases: ['Korea', 'Republic of Korea'] }),
      c('flag-india', 'India', 'Flag of India', 'Saffron, white and green stripes with a blue 24-spoke wheel, the Ashoka Chakra.'),
      c('flag-uk', 'United Kingdom', 'Flag of the United Kingdom', 'The Union Jack, combining the crosses of England, Scotland and Ireland.', { aliases: ['UK', 'Great Britain', 'Britain', 'Union Jack'], fact: "Wales is part of the UK but isn't represented on it at all." }),
      c('flag-mozambique', 'Mozambique', 'Flag of Mozambique', 'Green, black and gold stripes with a red triangle bearing a book, a hoe and a rifle.', { fact: "It's the only national flag with a modern assault rifle on it, an AK-47." }),
    ],
  },
  {
    id: 'instruments',
    related: ['celebs', 'tools'],
    title: 'Musical Instruments',
    emoji: '🎻',
    categoryId: 'arts',
    prompt: 'What instrument is this?',
    description: 'Strings, brass, woodwind and a few curveballs from around the world.',
    free: false,
    cards: [
      c('ins-violin', 'Violin', 'Violin', 'The smallest and highest-pitched member of the string family, played with a bow.', { aliases: ['Fiddle'], fact: "Violin bows are traditionally strung with real horse hair, rubbed with rosin so they grip the strings." }),
      c('ins-cello', 'Cello', 'Cello', 'A large bowed string instrument played sitting down, held between the knees.', { aliases: ['Violoncello'] }),
      c('ins-trumpet', 'Trumpet', 'Trumpet', 'The highest brass instrument, with three valves to change the note.'),
      c('ins-trombone', 'Trombone', 'Trombone', 'A brass instrument that changes pitch with a sliding tube instead of valves.'),
      c('ins-horn', 'French horn', 'French horn', 'A coiled brass instrument with a wide bell, played with one hand inside the bell.', { aliases: ['Horn'], fact: "Uncoiled, its tubing would stretch about 3.7 metres." }),
      c('ins-sax', 'Saxophone', 'Saxophone', 'A curved brass-bodied instrument invented by Adolphe Sax in the 1840s, a jazz staple.', { aliases: ['Sax'], fact: "Even though it's made of brass, it counts as a woodwind, because the sound comes from a reed, just like a clarinet." }),
      c('ins-clarinet', 'Clarinet', 'Clarinet', 'A single-reed woodwind with a straight black body and a bell at the end.'),
      c('ins-flute', 'Flute', 'Western concert flute', 'A woodwind played by blowing across a hole, held sideways.', { fact: "Flutes carved from bird bone and mammoth ivory have been found in German caves. They're over 35,000 years old." }),
      c('ins-harp', 'Harp', 'Harp', 'A large frame of strings plucked by hand. Concert harps have 47 strings.', { fact: "A concert harp has seven pedals. Each one retunes every string of the same note at once, all the way up the instrument." }),
      c('ins-banjo', 'Banjo', 'Banjo', 'A string instrument with a round, drum-like body, central to bluegrass.', { fact: "It grew out of instruments made by enslaved West Africans in the Caribbean and the American South." }),
      c('ins-ukulele', 'Ukulele', 'Ukulele', 'A small four-string guitar-like instrument from Hawaii.', { aliases: ['Uke'], fact: "The name is usually translated from Hawaiian as \"jumping flea\"." }),
      c('ins-sitar', 'Sitar', 'Sitar', 'A long-necked Indian string instrument with a gourd body and a buzzing tone.', { fact: "Besides the strings you play, it has a set of strings nobody touches. They ring by themselves when the played notes match them." }),
      c('ins-accordion', 'Accordion', 'Accordion', 'A box-shaped instrument squeezed in and out to push air past metal reeds.'),
    ],
  },
  {
    id: 'dogs',
    related: ['flags'],
    title: 'Dog Breeds',
    emoji: '🐕',
    categoryId: 'nature',
    prompt: 'What breed is this?',
    description: 'Tell your Lab from your Golden and your Husky from a wolf.',
    free: false,
    cards: [
      c('dog-labrador', 'Labrador Retriever', 'Labrador Retriever', 'A friendly, outgoing retriever, for decades one of the most popular breeds in the world.', { aliases: ['Labrador', 'Lab'], fact: "Despite the name, the breed comes from Newfoundland, not Labrador." }),
      c('dog-gsd', 'German Shepherd', 'German Shepherd', 'A large, intelligent herding dog widely used by police and as a guide dog.', { aliases: ['Alsatian', 'German Shepherd Dog'] }),
      c('dog-golden', 'Golden Retriever', 'Golden Retriever', 'A gentle Scottish gundog with a dense golden coat.', { aliases: ['Golden'] }),
      c('dog-frenchie', 'French Bulldog', 'French Bulldog', 'A small, compact bulldog with upright "bat ears".', { aliases: ['Frenchie'] }),
      c('dog-beagle', 'Beagle', 'Beagle', 'A small scent hound with long ears, bred to track hares.'),
      c('dog-poodle', 'Poodle', 'Poodle', 'A curly-coated breed in toy, miniature and standard sizes, known for being very clever.', { fact: "The fancy show haircut started as a practical one for a water dog: shaved for swimming, with tufts left to keep the joints and chest warm." }),
      c('dog-dachshund', 'Dachshund', 'Dachshund', 'A long, low-bodied hound, nicknamed the sausage dog.', { aliases: ['Sausage dog', 'Wiener dog'], fact: "It was bred to dig into burrows after badgers. Dachs is German for badger." }),
      c('dog-husky', 'Siberian Husky', 'Siberian Husky', 'A thick-coated sled dog, often with striking blue or two-coloured eyes.', { aliases: ['Husky'] }),
      c('dog-bordercollie', 'Border Collie', 'Border Collie', 'A fast, intense sheepdog from the border between England and Scotland.', { fact: "A Border Collie called Chaser learned the names of more than 1,000 toys and could fetch any of them by name." }),
      c('dog-pug', 'Pug', 'Pug', 'A small, wrinkly-faced breed from ancient China with a curled tail.'),
      c('dog-dalmatian', 'Dalmatian', 'Dalmatian (dog)', 'A white dog covered in black or liver spots, once a carriage guard.', { fact: "Dalmatian puppies are born pure white. Their spots appear over the first few weeks." }),
      c('dog-shiba', 'Shiba Inu', 'Shiba Inu', 'A small, fox-like Japanese hunting dog.', { aliases: ['Shiba'], fact: "A Shiba Inu called Kabosu is the face of the Doge meme, and inspired the Dogecoin cryptocurrency." }),
    ],
  },
  {
    id: 'materials',
    related: ['construction', 'tools', 'landmarks'],
    title: 'Building Materials',
    emoji: '🧱',
    categoryId: 'trades',
    prompt: 'What building material is this?',
    description: 'What houses, bridges and towers are actually made of.',
    free: false,
    cards: [
      c('mat-brick', 'Brick', 'Brick', 'Blocks of clay fired in a kiln, laid in rows with mortar.', { aliases: ['Bricks'] }),
      c('mat-concrete', 'Concrete', 'Concrete', 'Cement, water, sand and gravel that set into artificial stone. The most used building material in the world.', { fact: "The Pantheon in Rome is about 1,900 years old and still has the largest unreinforced concrete dome in the world." }),
      c('mat-marble', 'Marble', 'Marble', 'Limestone changed by heat and pressure into a stone that takes a high polish.'),
      c('mat-granite', 'Granite', 'Granite', 'A hard, speckled stone formed from cooled magma, popular for worktops.'),
      c('mat-plywood', 'Plywood', 'Plywood', 'Thin sheets of wood veneer glued together with the grain of each layer at right angles.'),
      c('mat-osb', 'Oriented strand board', 'Oriented strand board', 'Board made from flakes of wood pressed together with glue, used for walls and floors.', { aliases: ['OSB', 'Chipboard'] }),
      c('mat-drywall', 'Drywall', 'Drywall', 'Panels of gypsum plaster between sheets of paper, used for indoor walls and ceilings.', { aliases: ['Plasterboard', 'Gypsum board', 'Sheetrock'] }),
      c('mat-slate', 'Slate', 'Slate', 'A fine-grained stone that splits into thin, flat sheets, used for roofs.'),
      c('mat-rebar', 'Rebar', 'Rebar', 'Ribbed steel bars set inside concrete to make it strong under tension.', { aliases: ['Reinforcing bar', 'Reinforcing steel'], fact: "Steel and concrete expand with heat by almost exactly the same amount. That's why reinforced concrete doesn't crack itself apart on hot days." }),
      c('mat-terracotta', 'Terracotta', 'Terracotta', 'Reddish-brown fired clay, used for roof tiles, pots and decoration.', { fact: "China's Terracotta Army has thousands of life-size soldiers, and no two faces are quite alike." }),
      c('mat-cinderblock', 'Cinder block', 'Concrete block', 'A large hollow block of concrete, used for fast, cheap walls.', { aliases: ['Breeze block', 'Concrete block', 'Cinderblock', 'CMU'] }),
    ],
  },
  {
    id: 'sports',
    related: ['flags', 'celebs', 'brands'],
    title: 'Sports',
    emoji: '🏀',
    categoryId: 'sports',
    prompt: 'Which sport is this?',
    description: 'Name the sport from a single snapshot of play.',
    free: false,
    cards: [
      c('sp-cricket', 'Cricket', 'Cricket', 'A bat-and-ball game between two teams of eleven, hugely popular in India, England and Australia.', { fact: "A Test match can last five days and still end in a draw." }),
      c('sp-curling', 'Curling', 'Curling', 'Teams slide granite stones across ice towards a target, sweeping to steer them.', { fact: "Many of the world's best curling stones are made from granite quarried on one tiny, uninhabited Scottish island, Ailsa Craig." }),
      c('sp-rugby', 'Rugby union', 'Rugby union', 'A contact sport with fifteen players a side, played with an oval ball that can only be passed backwards.', { aliases: ['Rugby'] }),
      c('sp-lacrosse', 'Lacrosse', 'Lacrosse', 'Players catch and throw a rubber ball using sticks with a net pocket.'),
      c('sp-polo', 'Polo', 'Polo', 'Teams on horseback hit a ball with long mallets.'),
      c('sp-fencing', 'Fencing', 'Fencing', 'Sword fighting as a sport, with foil, épée and sabre, scored electronically.'),
      c('sp-waterpolo', 'Water polo', 'Water polo', 'A team ball game played in deep water, where players can\'t touch the bottom.'),
      c('sp-sumo', 'Sumo', 'Sumo', 'Japanese wrestling where you lose by leaving the ring or touching the ground with anything but your feet.', { aliases: ['Sumo wrestling'] }),
      c('sp-badminton', 'Badminton', 'Badminton', 'A racket sport played over a high net with a feathered shuttlecock.', { fact: "A smashed shuttlecock has been clocked at over 500 km/h, faster than the ball in any other racket sport." }),
      c('sp-volleyball', 'Volleyball', 'Volleyball', 'Two teams of six hit a ball over a high net, with three touches allowed per side.', { fact: "It was invented in 1895 as a gentler alternative to basketball, which had been invented four years earlier in a town just a few miles away." }),
      c('sp-icehockey', 'Ice hockey', 'Ice hockey', 'A fast team sport on ice where players use sticks to shoot a rubber puck.', { aliases: ['Hockey'] }),
      c('sp-handball', 'Handball', 'Handball', 'Seven-a-side indoor team sport where players throw a ball into the opponents\' goal.', { aliases: ['Team handball'] }),
    ],
  },
  {
    id: 'celebs',
    related: ['instruments', 'sports'],
    title: 'Modern Celebrities',
    emoji: '⭐',
    categoryId: 'pop',
    prompt: 'Who is this?',
    description: 'Stars of music, film and sport from the last few decades.',
    free: false,
    cards: [
      c('celeb-swift', 'Taylor Swift', 'Taylor Swift', 'American singer-songwriter whose Eras Tour became the highest-grossing concert tour ever.', { aliases: ['Swift'] }),
      c('celeb-beyonce', 'Beyoncé', 'Beyoncé', 'American singer who first found fame in Destiny\'s Child, and the most Grammy-winning artist in history.', { aliases: ['Beyonce'] }),
      c('celeb-messi', 'Lionel Messi', 'Lionel Messi', 'Argentine footballer, an eight-time Ballon d\'Or winner who led Argentina to the 2022 World Cup.', { aliases: ['Messi'], fact: "As a boy he was treated for a growth hormone deficiency, and Barcelona signed him partly by agreeing to pay for his treatment." }),
      c('celeb-ronaldo', 'Cristiano Ronaldo', 'Cristiano Ronaldo', 'Portuguese footballer and the all-time top scorer in men\'s international football.', { aliases: ['Ronaldo', 'CR7'] }),
      c('celeb-lebron', 'LeBron James', 'LeBron James', 'American basketball player and the NBA\'s all-time leading scorer.', { aliases: ['LeBron', 'Lebron James'] }),
      c('celeb-serena', 'Serena Williams', 'Serena Williams', 'American tennis player who won 23 Grand Slam singles titles.', { aliases: ['Serena'] }),
      c('celeb-oprah', 'Oprah Winfrey', 'Oprah Winfrey', 'American talk show host, producer and media owner.', { aliases: ['Oprah'] }),
      c('celeb-rihanna', 'Rihanna', 'Rihanna', 'Barbadian singer and founder of the Fenty Beauty brand.', { fact: "Rihanna is her middle name. She was born Robyn Rihanna Fenty, which is where Fenty Beauty gets its name." }),
      c('celeb-keanu', 'Keanu Reeves', 'Keanu Reeves', 'Canadian actor known for The Matrix and John Wick.', { aliases: ['Keanu'], fact: "He was born in Beirut, Lebanon, and grew up mostly in Toronto." }),
      c('celeb-therock', 'Dwayne Johnson', 'Dwayne Johnson', 'Wrestler turned actor known as The Rock, one of the highest-paid actors in Hollywood.', { aliases: ['The Rock', 'Dwayne The Rock Johnson'], fact: "Before wrestling, he played college football for the University of Miami and was on its 1991 national championship team." }),
    ],
  },
  // Coming soon: shown on the map so users can see where the app is going.
  // Movie posters and brand logos aren't freely licensed, so these need custom images.
  { id: 'movies', related: ['celebs'], title: 'Movies', emoji: '🎬', categoryId: 'pop', prompt: 'Which movie is this?', description: 'Coming soon.', free: false, cards: [] },
  { id: 'brands', related: ['consoles', 'fabrics'], title: 'Brands & Logos', emoji: '🏷️', categoryId: 'pop', prompt: 'Which brand is this?', description: 'Coming soon.', free: false, cards: [] },
];

export const RAW_TOPICS = TOPICS;
