export const DEPARTMENTS: Record<string, readonly string[]> = {
  "Graduate Programs": [
    "Master of Business Administration (MBA)",
    "Masters of Public Health (MPH)",
    "MSc in CSE",
    "MSc in CE",
  ],
  "Undergraduate Programs": [
    "Bachelor of Computer Science and Engineering (BCSE)",
    "Bachelor of Science in Civil Engineering (BSCE)",
    "Bachelor of Science in Electrical & Electronic Engineering (BSEEE)",
    "Bachelor of Science in Mechanical Engineering (BSME)",
    "Bachelor of Business Administration (BBA)",
    "Bachelor of Science in Agriculture (BSAg)",
    "Bachelor of Arts in Tourism and Hospitality Management (BATHM)",
    "Bachelor of Arts in Economics (BAEcon)",
    "Bachelor of Science in Nursing (BSN)",
    "Bachelor of Arts in English (BAEng)",
  ],
};

export const ALL_DEPARTMENTS: string[] = Object.values(DEPARTMENTS).flat();
