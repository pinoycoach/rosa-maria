// The official prayers. Never written or changed by AI: each text is copied once from an approved source,
// checked word for word by a person on the review desk (/#curate), and only then shown. Editing a text here
// cancels its review automatically (the review is tied to the exact words), so it goes back to "awaiting review".
//
// The English texts below were copied from docs/rosary-basics.md section 4, unchanged (a test checks this).
// Filipino texts are added only when copied from an official CBCP or parish source.

export type Language = 'en' | 'fil';

export interface Prayer {
  id: string;
  title: string;
  language: Language;
  text: string;
  /** The approved source the reviewer checks the words against. */
  source: string;
  /** Where the reviewer can read that source. */
  sourceUrl: string;
}

const USCCB_ROSARY = {
  source: 'USCCB, How to Pray the Rosary',
  sourceUrl: 'https://www.usccb.org/how-to-pray-the-rosary',
};

export const PRAYERS: Prayer[] = [
  {
    id: 'sign-of-the-cross',
    title: 'Sign of the Cross',
    language: 'en',
    text: "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.",
    ...USCCB_ROSARY,
  },
  {
    id: 'apostles-creed',
    title: "Apostles' Creed",
    language: 'en',
    text: "I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
    ...USCCB_ROSARY,
  },
  {
    id: 'our-father',
    title: 'Our Father',
    language: 'en',
    text: "Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
    ...USCCB_ROSARY,
  },
  {
    id: 'hail-mary',
    title: 'Hail Mary',
    language: 'en',
    text: "Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
    ...USCCB_ROSARY,
  },
  {
    id: 'glory-be',
    title: 'Glory Be',
    language: 'en',
    text: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
    ...USCCB_ROSARY,
  },
  {
    id: 'fatima-prayer',
    title: 'Fatima Prayer',
    language: 'en',
    text: "O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those in most need of thy mercy. Amen.",
    ...USCCB_ROSARY,
  },
  {
    id: 'hail-holy-queen',
    title: 'Hail, Holy Queen',
    language: 'en',
    text: "Hail, holy Queen, Mother of mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.\n℣. Pray for us, O holy Mother of God.\n℟. That we may be made worthy of the promises of Christ.",
    ...USCCB_ROSARY,
  },
  {
    id: 'rosary-closing-prayer',
    title: 'Closing prayer',
    language: 'en',
    text: "Let us pray. O God, whose only begotten Son, by his life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech thee, that while meditating on these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.",
    ...USCCB_ROSARY,
  },
];

export const prayerById = (id: string) => PRAYERS.find((p) => p.id === id) || null;
