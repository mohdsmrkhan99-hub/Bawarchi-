const one = (name, price) => ({ name, variants: [{ name: "Regular", price: String(price) }] });
const many = (name, variants) => ({ name, variants: variants.map(([variant, price]) => ({ name: variant, price })) });
const group = (name, items) => ({ name, items });

export const MENU_DATA = [
  {
    name: "Veg Course",
    subcategories: [
      group("Veg Soups", [
        one("Tamato Soup", 160), one("Veg Sweet Corn Soup", 160), one("Veg Hot & Sour Soup", 160),
        one("Veg Manchow Soup", 160), one("Veg Clear Soup", 160), one("Veg Mushroom Soup", 160),
        one("Veg Thai Soup", 160), one("Veg Lemon Coriander Soup", 160), one("Veg Lemon Soup", 160),
      ]),
      group("Veg Kabab", [one("Paneer Tikka", 280), one("Gobi Tikka", 260), one("Mushroom Tikka", 260), one("Paneer Haryali Kabab", 280), one("Veg Sheekh Kabab", 260)]),
      group("Veg Starters", [
        one("Crispy Vegetables", 190), one("Veg Spring Roll", 200), one("Veg Manchuria (Dry/Wet)", 170),
        one("Veg Schezwan (Dry/Wet)", 190), one("Aloo 65", 190), one("Gobi 65", 190), one("Gobi Manchuria", 200),
        one("Chilli Garlic Mushroom", 240), one("Paneer 65", 260), one("Paneer Manchuria", 260),
        one("Chilli Paneer (Dry/Wet)", 260), one("Schezwan Paneer (Dry/Wet)", 260), one("Ginger Paneer (Dry/Wet)", 270),
        one("Pepper Paneer", 290), one("Chilli Baby Corn", 260), one("Schezwan Baby Corn (Dry/Wet)", 260),
        one("Ginger Baby Corn", 260), one("Pepper Baby Corn", 260), one("Veg 65", 200), one("Mushroom 65", 220),
        one("Crispy Corn", 220), one("French Fries", 190),
      ]),
      group("Veg Platter", [many("Veg Platter", [["Single", 450], ["Full", 800]])]),
      group("Veg Noodles", [one("Soft Noodle's", 120), one("Pan Fried Noodle's", 150), one("Schezwan Noodle's", 130), one("Singapore Noodle's", 130), one("American Chapsi", 160), one("Basket Noodle's", 160)]),
      group("Veg Curries", [
        many("Mix Veg Curry", [["Single", 160], ["Full", 250]]), many("Kadai Veg", [["Single", 160], ["Full", 250]]),
        many("Aloo Gobi Masala", [["Single", 160], ["Full", 250]]), many("Veg Chatpata", [["Single", 160], ["Full", 250]]),
        many("Veg Kunda Masala", [["Single", 160], ["Full", 250]]), many("Paneer Butter Masala", [["Single", 160], ["Full", 260]]),
        many("Paneer Chatpata", [["Single", 160], ["Full", 280]]), many("Paneer Shahi Kurma", [["Single", 160], ["Full", 280]]),
        many("Palak Paneer", [["Single", 160], ["Full", 260]]), many("Bawarchi Spl. Veg", [["Single", 160], ["Full", 300]]),
        many("Mushroom Masala", [["Single", 160], ["Full", 280]]), many("Veg Kofta", [["Single", 160], ["Full", 290]]),
        many("Dal Fry", [["Single", 150], ["Full", 160]]), many("Dal Tadka", [["Single", 160], ["Full", 160]]),
        many("Tomato Curry", [["Single", 160], ["Full", 160]]), many("Kaju Curry", [["Single", 160], ["Full", 290]]),
        many("Kaju Paneer", [["Single", 160], ["Full", 320]]), many("Kaju Paneer Tikka Masala", [["Single", 160], ["Full", 340]]),
        many("Paneer Kofta", [["Single", 160], ["Full", 340]]), many("Paneer Kadai", [["Single", 160], ["Full", 320]]),
        many("Mushroom Kadai", [["Single", 160], ["Full", 280]]), many("Mushroom Chatpata", [["Single", 160], ["Full", 280]]),
        many("Methi Chaman", [["Single", 160], ["Full", 280]]),
      ]),
      group("Veg Dishes", [one("Veg Fried Rice", 130), one("Veg Schezwan Rice", 130), one("Veg Corn Mushroom Rice", 150), one("Veg Curd Rice", 120), one("Veg Lemon Rice", 120), one("Veg Zeera Rice", 120), one("Veg Basmati Rice", 130), one("Veg Tomato Rice", 140)]),
      group("Veg Biryani", [
        many("Veg Biryani", [["Single", 160], ["Full", 300], ["Family", 550], ["Jumbo", 820], ["Handi", 350]]),
        many("Paneer Biryani", [["Single", 190], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Mushroom Biryani", [["Single", 190], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Kaju Biryani", [["Single", 190], ["Full", 370], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
      ]),
      group("Veg Mandi", [many("Veg Mandi", [["1 Pcs", 240], ["2 Pcs", 450], ["3 Pcs", 550]])]),
      group("Roti Naan", [one("Butter Naan", 35), one("Plain Naan", 30), one("Rumali Roti", 20), one("Tandoori Roti", 20), one("Butter Roti", 25), one("Lacha Parata", 40), one("Plain Parata", 30), one("Pudina Parata", 35), one("Paneer Kulcha", 80), one("Masala Kulcha", 60), one("Garlic Naan", 45)]),
    ],
  },
  {
    name: "Non Veg Course",
    subcategories: [
      group("Non Veg Soups", [
        one("Chicken Sweet Corn Soup", 170), one("Chicken Manchow Soup", 170), one("Chicken Hot& Sour Soup", 170),
        one("Chicken Thai Soup", 170), one("Chicken Clear Soup", 170), one("Chicken Mushroom Soup", 170),
        one("Chicken Lemon Coriander Soup", 170), one("Chicken Lemon Soup", 170),
      ]),
      group("Non Veg Starters", [
        many("Special Bawarchi Roll", [["Single", 260], ["Full", 480]]), many("Chicken Drumstick", [["Single", 160], ["Full", 300]]),
        many("Chilli Garlic Chicken", [["Single", 180], ["Full", 320]]), many("Fried Chicken Wings", [["Single", 190], ["Full", 320]]),
        many("Chilli Chicken Dry", [["Single", 190], ["Full", 320]]), many("Chicken Manchuria", [["Single", 190], ["Full", 320]]),
        many("Pepper Chicken", [["Single", 190], ["Full", 320]]), many("Schezwan Chicken", [["Single", 190], ["Full", 320]]),
        many("Chicken Spring Roll", [["Single", 190], ["Full", 250]]), many("Chicken 65", [["Single", 190], ["Full", 320]]),
        many("Chicken Manchuria (Dry/Wet)", [["Single", 190], ["Full", 340]]), many("Garlic Chicken (Dry/Wet)", [["Single", 190], ["Full", 340]]),
        many("Ginger Chicken (Dry/Wet)", [["Single", 190], ["Full", 340]]), many("Chicken Majestic", [["Single", 190], ["Full", 360]]),
        many("Chicken Pakoda", [["Single", 190], ["Full", 300]]), many("Chicken Lollipop", [["Single", 190], ["Full", 340]]),
        many("Chicken 555", [["Single", 190], ["Full", 340]]), many("Chicken 95", [["Single", 220], ["Full", 350]]),
        many("Dragon Chicken", [["Single", 220], ["Full", 360]]), many("Thailand Chicken", [["Single", 220], ["Full", 360]]),
        many("Silver Chicken", [["Single", 220], ["Full", 360]]), many("Chicken Roast Dry", [["Single", 190], ["Full", 300]]),
        many("Chicken Mangolian", [["Single", 190], ["Full", 360]]), one("Egg Manchuria", 150), one("Egg Chilly", 160),
        one("Egg 65", 150), one("Corn Flex Chicken", 300), one("Lemon Chicken", 260), one("Honey Chicken", 280),
      ]),
      group("Non Veg Kabab", [
        many("Tandoori Chicken", [["Single", 280], ["Full", 480]]), many("Tangdi Kabab", [["Single", 220], ["Full", 440]]),
        many("Tandoori Leg (1 Piece)", [["Single", 160], ["Full", 290]]), many("Arabian Kabab", [["Single", 160], ["Full", 290]]),
        many("Chicken Tikka", [["Single", 160], ["Full", 290]]), many("Haryali Kabab", [["Single", 160], ["Full", 290]]),
        many("Reshmi Kabab", [["Single", 160], ["Full", 290]]), many("Banjara Kabab", [["Single", 160], ["Full", 290]]),
        many("Malai Kabab", [["Single", 160], ["Full", 290]]), many("Garlic Kabab", [["Single", 160], ["Full", 290]]),
        many("Tandoori Wings", [["Single", 160], ["Full", 300]]), many("Tangdi Kabab (1 Piece)", [["Single", 160], ["Full", 300]]),
        many("Mini Sheekh Kabab", [["Single", 160], ["Full", 300]]),
      ]),
      group("Tandoori Chinese Platter", [
        many("Chinese Veg Platter", [["Single", 450], ["Full", 800]]), many("Tandoori Veg Platter", [["Single", 450], ["Full", 800]]),
        many("Tandoori Chicken Platter", [["Single", 540], ["Full", 940]]), many("Sukka Mutton", [["Single", 320], ["Full", 550]]),
        many("Chinese Platter Chicken", [["Single", 450], ["Full", 850]]), many("Chicken Lamba Hot Pan", [["Single", 250], ["Full", 500]]),
      ]),
      group("Non Veg Curries", [
        many("Chicken Kheema Masala Boneless", [["Single", null], ["Full", 320]]),
        many("Chicken Masala Bone", [["Single", null], ["Full", 240]]), many("Chicken Curry Bone", [["Single", 160], ["Full", 260]]),
        many("Chicken Curry Boneless", [["Single", null], ["Full", 260]]), many("Chicken Butter Masala Boneless", [["Single", null], ["Full", 260]]),
        many("Chicken Kadai", [["Single", null], ["Full", 260]]), many("Chicken Dopyaza", [["Single", null], ["Full", 260]]),
        many("Chicken Tikka Masala", [["Single", null], ["Full", 300]]), many("Chicken Mughlai Bone", [["Single", null], ["Full", 300]]),
        many("Chicken Nawabi", [["Single", null], ["Full", 320]]), many("Methi Chicken Bone", [["Single", null], ["Full", 260]]),
        many("Methi Chicken Boneless", [["Single", null], ["Full", 300]]), many("Achari Chicken Masala Boneless", [["Single", null], ["Full", 300]]),
        many("Telangana Chicken Curry Bone", [["Single", null], ["Full", 240]]), many("Telangana Chicken Curry Boneless", [["Single", null], ["Full", 280]]),
        many("Egg Curry", [["Single", 150], ["Full", 160]]), many("Egg Masala", [["Single", 150], ["Full", 160]]),
        many("Egg Burji", [["Single", 150], ["Full", 160]]), many("Chicken Fry", [["Single", 350], ["Full", null]]),
        many("Chicken Chatpata Bone", [["Single", 260], ["Full", 300]]), many("Chicken Chatpata Boneless", [["Single", 300], ["Full", 320]]),
        many("Chicken Shahi Kurma Bone", [["Single", 290], ["Full", 320]]), many("Afghani Chicken Bone", [["Single", 290], ["Full", 290]]),
        many("Tandoori Chicken Curry Bone", [["Single", 320], ["Full", null]]),
      ]),
      group("Chicken Rice Dishes", [one("Fried Rice", 130), one("Schezwan Rice", 130), one("Corn Mushroom Rice", 150), one("Curd Rice", 120), one("Lemon Rice", 120), one("Zeera Rice", 120), one("Basmati Rice", 130), one("Tomato Rice", 140)]),
      group("Noodles", [one("Soft Noodle's", 130), one("Pan Fried Noodle's", 180), one("Schezwan Noodle's", 160), one("Singapore Noodle's", 160), one("American Chapsi", 170), one("Basket Noodle's", 190)]),
      group("All Biryani", [
        many("Paneer Biryani", [["Single", 190], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Veg Biryani", [["Single", 160], ["Full", 300], ["Family", 550], ["Jumbo", 820], ["Handi", 350]]),
        many("Kaju Biryani", [["Single", 190], ["Full", 370], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Mushroom Biryani", [["Single", 190], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Egg Biryani", [["Single", 160], ["Full", 300], ["Family", 550], ["Jumbo", 820], ["Handi", 350]]),
        many("Mutton Biryani", [["Single", 190], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Chicken Biryani", [["Single", 160], ["Full", 300], ["Family", 550], ["Jumbo", 820], ["Handi", 350]]),
        many("Chicken 65 Biryani (Boneless)", [["Single", 190], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Tangdi Leg Biryani", [["Single", 180], ["Full", 380]]), many("Tandoori Biryani", [["Single", 280], ["Full", 550]]),
        many("Chicken Kheema Biryani", [["Single", 200], ["Full", 350], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Prawns Biryani", [["Single", 200], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
        many("Fish Biryani", [["Single", 200], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]]),
      ]),
      group("Chicken Mandi", [
        many("Chicken Mandi", [["1 Pcs", 250], ["2 Pcs", 450], ["3 Pcs", 580], ["4 Pcs", 780]]),
        many("BBQ Mandi", [["1 Pcs", 300], ["2 Pcs", 560], ["3 Pcs", 740], ["4 Pcs", 970]]),
      ]),
    ],
  },
];

MENU_DATA.push(
  {
    name: "Egg Course",
    subcategories: [
      group("Egg Starters", [
        one("Egg 65", 160), one("Egg Fry", 160), one("Egg Ginger", 160), one("Egg Roast", 160),
        one("Egg Burji", 150), one("Boiled Egg", 20), one("Egg Manchuria", 150), one("Egg Chilly", 160), one("Omlet", 60),
      ]),
      group("Egg Curries", [one("Egg Curry", 150), one("Egg Masala", 160)]),
      group("Egg Noodles", [one("Egg Soft", 140), one("Egg Pan Fried", 180), one("Egg Schezwan", 130), one("Egg Singapore", 130), one("Egg Manchuria Noodle's", 180)]),
      group("Egg Fried Dishes", [one("Egg Fried Rice", 140), one("Egg Schezwan Rice", 150), one("Egg Corn Mushroom Rice", 150)]),
      group("Egg Biryani", [many("Egg Biryani", [["Single", 160], ["Full", 300], ["Family", 550], ["Jumbo", 820], ["Handi", 350]])]),
      group("Roti Naan", [one("Butter Naan", 35), one("Plain Naan", 30), one("Rumali Roti", 20), one("Tandoori Roti", 20), one("Butter Roti", 25), one("Lacha Parata", 40), one("Plain Parata", 30), one("Pudina Parata", 35), one("Paneer Kulcha", 80), one("Masala Kulcha", 60), one("Garlic Naan", 45)]),
    ],
  },
  {
    name: "Mutton Course",
    subcategories: [
      group("Mutton Soups", [one("Mutton Sweet Corn", 220), one("Mutton Manchow", 220)]),
      group("Mutton Starters", [Object.assign(one("Mutton Fry", 350), { description: "8 Pcs" }), one("Mutton Manchuria", 350), one("Mutton 65", 350), one("Mutton Sheekh Kebab", 350)]),
      group("Mutton Curries", [
        many("Mutton Masala", [["Single", 190], ["Full", 350]]), many("Mutton Kadai", [["Single", 190], ["Full", 350]]),
        many("Mutton Curry", [["Single", 190], ["Full", 350]]), many("Mutton Kheema Masala", [["Single", 190], ["Full", 350]]),
        many("Mutton Rogon Juice", [["Single", 190], ["Full", 350]]), many("Telangana Mutton", [["Single", 180], ["Full", 350]]),
        many("Mutton Nawabi", [["Single", 190], ["Full", 360]]), Object.assign(many("Mutton Fry", [["Single", 190], ["Full", 360]]), { description: "8 Pcs" }),
        many("Methi Mutton", [["Single", 190], ["Full", 370]]), many("Mutton Chatpata", [["Single", 180], ["Full", 360]]),
        many("Mutton Kaju", [["Single", 220], ["Full", 360]]),
      ]),
      group("Mutton Biryani", [many("Mutton Biryani", [["Single", 190], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]])]),
      group("Mutton Mandi", [many("Mutton Mandi", [["1 Pcs", 300], ["2 Pcs", 580], ["3 Pcs", 810], ["4 Pcs", 990]])]),
    ],
  },
  {
    name: "Seafood",
    subcategories: [
      group("Seafood Starters", [one("Fish Fry", 320), one("Fish Pepper", 320), one("Fish Chilli", 320), one("Fish Apollo", 320), one("Prawn's 65", 340), one("Prawn's Pepper", 340), one("Prawn's Chilli", 320), one("Loose Prawn's", 320), one("Prawn's Fry", 320), one("Chilli Garlic Fish", 320), one("Singapore Fish", 320), one("Corn Fry Fish", 320)]),
      group("Seafood Curries", [one("Fish Curry", 280), one("Fish Masala", 290), one("Fish Kadai", 280), one("Fish Ginger", 280), one("Prawns Ginger", 260), one("Prawns Curry", 270), one("Prawns Kadai", 280), one("Prawns Masala", 280)]),
      group("Fish Biryani", [many("Fish Biryani", [["Single", 200], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]])]),
      group("Prawns Biryani", [many("Prawns Biryani", [["Single", 200], ["Full", 380], ["Family", 720], ["Jumbo", 950], ["Handi", 430]])]),
      group("Fish Mandi", [many("Fish Mandi", [["1 Pcs", 310], ["2 Pcs", 550], ["3 Pcs", 800]])]),
      group("Prawns Mandi", [many("Prawns Mandi", [["1 Pcs", 310], ["2 Pcs", 550], ["3 Pcs", 800]])]),
    ],
  },
  {
    name: "Mandi",
    subcategories: [
      group("Chicken Mandi", [many("Chicken Mandi", [["1 Pcs", 250], ["2 Pcs", 450], ["3 Pcs", 580], ["4 Pcs", 780]]), many("BBQ Mandi", [["1 Pcs", 300], ["2 Pcs", 560], ["3 Pcs", 740], ["4 Pcs", 970]])]),
      group("Mutton Mandi", [many("Mutton Mandi", [["1 Pcs", 300], ["2 Pcs", 580], ["3 Pcs", 810], ["4 Pcs", 990]])]),
    ],
  },
  {
    name: "Bagara Rice",
    subcategories: [
      group("Bagara Rice & Curries", [one("Chicken Bagara Rice", 200), one("Veg Bagara Rice", 160), one("Mutton Bagara Rice", 300), one("1KG Bagara Rice & 1KG Chicken Curry", 820), one("1KG Bagara Rice & 1KG Mutton Curry", 1320), one("1KG Bagara Rice & 1KG Desi Chicken Curry", 1470)]),
    ],
  },
  {
    name: "Extras",
    subcategories: [
      group("Extra Items", [one("Chicken 1 PC", 170), one("Mutton 1 PC", 220), one("Fish 1 PC", 190), one("Mandi Rice", 130), one("Mayonnaise", 30), one("Soup", 70), one("Plain Curd", 50), one("Boiled Egg", 20), one("Omlet", 60), one("Biryani Extra Piece", 130)]),
    ],
  },
  {
    name: "Shawarma",
    subcategories: [group("Shawarma", [one("Chicken Shawarma", 150), one("Extra Mayonnaise", 30)])],
  },
  {
    name: "Hot Drinks",
    subcategories: [group("Hot Drinks", [one("Irani Tea", 20), Object.assign(one("Biscuit", 10), { description: "4 P" }), one("Black Tea", 20), one("Pauna", 35), one("Coffee", 30), one("Boost", 30), one("Horlicks", 30), one("Milk", 30)])],
  },
  {
    name: "Sweets",
    subcategories: [group("Sweets", [one("Kaddu Ki Kheer", 50), one("Badam Ki Kheer", 50), one("Double Ka Metha", 40), one("Qubani Ka Meetha", 50)])],
  },
);

export const MENU_ADD_ONS = [];
