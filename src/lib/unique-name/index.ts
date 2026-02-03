import {
  NumberDictionary,
  adjectives,
  animals,
  uniqueNamesGenerator,
  type Config,
} from "unique-names-generator";

const numberDictionary = NumberDictionary.generate({ min: 1000, max: 9999 });

const uniqueNamesConfig = {
  dictionaries: [adjectives, animals, numberDictionary],
  separator: "",
  length: 3,
  style: "capital",
} satisfies Config;

export const getRandomName = () => uniqueNamesGenerator(uniqueNamesConfig);
