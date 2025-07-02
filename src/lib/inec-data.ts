export const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

export const inecCenters = {
    "Lagos": ["Ikeja LGA Office", "Surulere LGA Office", "Lekki Phase 1 Center", "Victoria Island Center", "Alimosho LGA Office"],
    "FCT - Abuja": ["INEC Headquarters", "Garki Area 10 Office", "Wuse Zone 2 Center", "Kubwa District Center", "Bwari Area Council Office"],
    "Rivers": ["Port Harcourt City Hall", "Obio/Akpor LGA Office", "Eleme Center", "Bonny Island Center"],
    "Kano": ["Kano Municipal LGA Office", "Nassarawa LGA Office", "Fagge LGA Office", "Tarauni LGA Office"],
    "Anambra": ["Awka South LGA Office", "Onitsha North LGA Office", "Nnewi North Center"],
    "Oyo": ["Ibadan North LGA Office", "Ibadan SW LGA Office", "Ogbomosho North Office"],
    "Kaduna": ["Kaduna North LGA Office", "Kaduna South LGA Office", "Zaria LGA Office"],
};

export type InecCenterData = typeof inecCenters;
