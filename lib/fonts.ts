import {
  Archivo_Black,
  Bebas_Neue,
  Lato,
  Libre_Baskerville,
  Merriweather,
  Montserrat,
  Nunito,
  Open_Sans,
  Oswald,
  Playfair_Display,
  Poppins,
  Quicksand,
  Raleway,
  Rubik,
  Source_Sans_3,
} from "next/font/google";

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-playfair-display",
});

const merriweather = Merriweather({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
  variable: "--font-merriweather",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-libre-baskerville",
});

const oswald = Oswald({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-oswald",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  display: "swap",
  variable: "--font-bebas-neue",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  display: "swap",
  variable: "--font-archivo-black",
});

const raleway = Raleway({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-raleway",
});

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-open-sans",
});

const lato = Lato({
  subsets: ["latin", "latin-ext"],
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
  variable: "--font-lato",
});

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-nunito",
});

const quicksand = Quicksand({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-quicksand",
});

const rubik = Rubik({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-rubik",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-source-sans-3",
});

export interface FontEntry {
  variable: string;
  className: string;
  label: string;
}

export const FONT_WHITELIST = {
  "playfair-display": {
    variable: playfairDisplay.variable,
    className: playfairDisplay.className,
    label: "Playfair Display",
  },
  merriweather: {
    variable: merriweather.variable,
    className: merriweather.className,
    label: "Merriweather",
  },
  "libre-baskerville": {
    variable: libreBaskerville.variable,
    className: libreBaskerville.className,
    label: "Libre Baskerville",
  },
  oswald: {
    variable: oswald.variable,
    className: oswald.className,
    label: "Oswald",
  },
  "bebas-neue": {
    variable: bebasNeue.variable,
    className: bebasNeue.className,
    label: "Bebas Neue",
  },
  "archivo-black": {
    variable: archivoBlack.variable,
    className: archivoBlack.className,
    label: "Archivo Black",
  },
  raleway: {
    variable: raleway.variable,
    className: raleway.className,
    label: "Raleway",
  },
  montserrat: {
    variable: montserrat.variable,
    className: montserrat.className,
    label: "Montserrat",
  },
  poppins: {
    variable: poppins.variable,
    className: poppins.className,
    label: "Poppins",
  },
  "open-sans": {
    variable: openSans.variable,
    className: openSans.className,
    label: "Open Sans",
  },
  lato: {
    variable: lato.variable,
    className: lato.className,
    label: "Lato",
  },
  nunito: {
    variable: nunito.variable,
    className: nunito.className,
    label: "Nunito",
  },
  quicksand: {
    variable: quicksand.variable,
    className: quicksand.className,
    label: "Quicksand",
  },
  rubik: {
    variable: rubik.variable,
    className: rubik.className,
    label: "Rubik",
  },
  "source-sans-3": {
    variable: sourceSans3.variable,
    className: sourceSans3.className,
    label: "Source Sans 3",
  },
} as const satisfies Record<string, FontEntry>;

export type FontKey = keyof typeof FONT_WHITELIST;

export const cssVarForFont = (key: FontKey): string => `--font-${key}`;

export const FONT_WHITELIST_VARIABLES = Object.values(FONT_WHITELIST)
  .map((font) => font.variable)
  .join(" ");

export const DEFAULT_FONT_KEY: FontKey = "playfair-display";
