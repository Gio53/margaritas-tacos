// ============================================================
// MARGARITAS TACOS — Complete Menu Data
// Extracted from PotraitMenu(1).png
// ============================================================

export interface MenuItem {
  name: string;
  price: number;
  isVegan?: boolean;
  note?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  badgeColor: string;
  description: string;
  specialNote?: string;
  items: MenuItem[];
}

export const menuCategories: MenuCategory[] = [
  {
    id: "mexican-street-tacos",
    name: "3 Mexican Street Tacos",
    badgeColor: "badge-orange",
    description: "Corn tortilla served with your choice of meat, cilantro, onions and guacamole",
    items: [
      { name: "Grilled Chicken", price: 12 },
      { name: "Birria (Brisket, Short Rib)", price: 12 },
      { name: "Steak (Top Sirloin)", price: 12 },
      { name: "Pastor", price: 12 },
      { name: "Carnitas", price: 12 },
      { name: "Shrimp", price: 12 },
      { name: "Chorizo", price: 12 },
      { name: "Lengua", price: 12 },
      { name: "Tinga (Spicy Chicken)", price: 12 },
    ],
  },
  {
    id: "tostadas",
    name: "Tostadas",
    badgeColor: "badge-red",
    description: "Black beans, cheese, lettuce, tomato, sour cream, avocado slice",
    items: [
      { name: "Grilled Chicken", price: 5.00 },
      { name: "Birria (Brisket, Short Rib)", price: 6.00 },
      { name: "Steak (Top Sirloin)", price: 6.00 },
      { name: "Pastor", price: 6.00 },
      { name: "Carnitas", price: 5.00 },
      { name: "Shrimp", price: 6.00 },
      { name: "Chorizo", price: 6.00 },
      { name: "Ground Beef", price: 5.00 },
      { name: "Tinga (Spicy Chicken)", price: 5.00 },
    ],
  },
  {
    id: "chilaquiles",
    name: "Chilaquiles",
    badgeColor: "badge-green",
    description: "Chips, red or green sauce, sour cream, cotija cheese",
    items: [
      { name: "Grilled Chicken", price: 13.00 },
      { name: "Birria (Brisket, Short Rib)", price: 14.00 },
      { name: "Steak (Top Sirloin)", price: 14.00 },
      { name: "Pastor", price: 14.00 },
      { name: "Carnitas", price: 14.00 },
      { name: "Shrimp", price: 14.00 },
      { name: "Chorizo", price: 14.00 },
      { name: "Tinga (Spicy Chicken)", price: 13.00 },
    ],
  },
  {
    id: "rice-bowls",
    name: "Rice Bowls",
    badgeColor: "badge-orange",
    description: "Black beans, cheese, lettuce, pico de gallo, sour cream, guacamole",
    items: [
      { name: "Grilled Chicken", price: 14.00 },
      { name: "Birria (Brisket, Short Rib)", price: 15.00 },
      { name: "Steak (Top Sirloin)", price: 15.00 },
      { name: "Pastor", price: 15.00 },
      { name: "Carnitas", price: 15.00 },
      { name: "Shrimp", price: 15.00 },
      { name: "Chorizo", price: 15.00 },
      { name: "Tinga (Spicy Chicken)", price: 14.00 },
      { name: "Vegan Rice Bowl", price: 14.00, isVegan: true, note: "Black beans, lettuce, pico de gallo, guacamole, mushrooms, green peppers, onions" },
    ],
  },
  {
    id: "burrito",
    name: "Burrito",
    badgeColor: "badge-green",
    description: "Beans, rice, cheese, pico de gallo, guacamole, sour cream, lettuce",
    items: [
      { name: "Grilled Chicken", price: 13.00 },
      { name: "Birria (Brisket, Short Rib)", price: 14.00 },
      { name: "Steak (Top Sirloin)", price: 14.00 },
      { name: "Pastor", price: 14.00 },
      { name: "Carnitas", price: 13.00 },
      { name: "Shrimp", price: 14.00 },
      { name: "Chorizo", price: 14.00 },
      { name: "Ground Beef", price: 13.00 },
      { name: "Tinga (Spicy Chicken)", price: 13.00 },
      { name: "Vegan Burrito", price: 13.00, isVegan: true, note: "Black beans, lettuce, pico de gallo, guacamole, mushrooms, green peppers, onions" },
    ],
  },
  {
    id: "quesadillas",
    name: "Quesadillas",
    badgeColor: "badge-red",
    description: "Sour cream, pico de gallo, guacamole (on the side)",
    items: [
      { name: "Grilled Chicken", price: 13.00 },
      { name: "Steak (Top Sirloin)", price: 14.00 },
      { name: "Pastor", price: 14.00 },
      { name: "Shrimp", price: 14.00 },
      { name: "Carnitas", price: 13.00 },
      { name: "Chorizo", price: 14.00 },
      { name: "Birria (Brisket, Short Rib)", price: 14.00 },
      { name: "Tinga (Spicy Chicken)", price: 13.00 },
      { name: "Ground Beef", price: 13.00 },
    ],
  },
  {
    id: "3-american-tacos",
    name: "3 American Tacos",
    badgeColor: "badge-blue",
    description: "Hard/soft shell, lettuce, cheese, sour cream, tomato",
    items: [
      { name: "Ground Beef", price: 8.00 },
      { name: "Grilled Chicken", price: 9.00 },
      { name: "Steak (Top Sirloin)", price: 10.00 },
    ],
  },
  {
    id: "mexican-nachos",
    name: "Mexican Nachos",
    badgeColor: "badge-yellow",
    description: "Black beans, cheese, pico de gallo, sour cream, guacamole",
    items: [
      { name: "Ground Beef", price: 13.00 },
      { name: "Chicken", price: 13.00 },
      { name: "Steak (Top Sirloin)", price: 14.00 },
      { name: "Shrimp", price: 14.00 },
      { name: "Pastor", price: 14.00 },
      { name: "Chorizo", price: 14.00 },
      { name: "Carnitas", price: 14.00 },
      { name: "Birria (Brisket, Short Rib)", price: 14.00 },
      { name: "Tinga (Spicy Chicken)", price: 13.00 },
    ],
  },
  {
    id: "torta",
    name: "Torta",
    badgeColor: "badge-teal",
    description: "Refried beans, cheese, tomato, lettuce, onion, avocado slice",
    items: [
      { name: "Grilled Chicken", price: 13.00 },
      { name: "Steak (Top Sirloin)", price: 14.00 },
      { name: "Birria (Brisket, Short Rib)", price: 14.00 },
      { name: "Pastor", price: 14.00 },
      { name: "Shrimp", price: 14.00 },
      { name: "Chorizo", price: 14.00 },
      { name: "Carnitas", price: 13.00 },
      { name: "Tinga (Spicy Chicken)", price: 13.00 },
      { name: "El Chavo (Ham/Jamon)", price: 13.00 },
    ],
  },
  {
    id: "flautas",
    name: "Flautas",
    badgeColor: "badge-orange",
    description: "Salad, rice & beans, sour cream, cotija cheese",
    items: [
      { name: "Grilled Chicken", price: 14.00 },
      { name: "Steak (Top Sirloin)", price: 15.00 },
      { name: "Cheese", price: 14.00 },
    ],
  },
  {
    id: "wet-burrito",
    name: "Wet Burrito",
    badgeColor: "badge-red",
    description: "Beans, rice, cheese, pico de gallo, guacamole, sour cream, lettuce",
    items: [
      { name: "Grilled Chicken", price: 14.00 },
      { name: "Birria (Brisket, Short Rib)", price: 15.00 },
      { name: "Steak (Top Sirloin)", price: 15.00 },
      { name: "Pastor", price: 15.00 },
      { name: "Carnitas", price: 14.00 },
      { name: "Shrimp", price: 15.00 },
      { name: "Chorizo", price: 15.00 },
      { name: "Ground Beef", price: 14.00 },
      { name: "Tinga (Spicy Chicken)", price: 14.00 },
      { name: "Vegan Burrito", price: 14.00, isVegan: true, note: "Black beans, lettuce, pico de gallo, guacamole, mushrooms, green peppers, onions" },
    ],
  },
  {
    id: "nachos",
    name: "Nachos",
    badgeColor: "badge-yellow",
    description: "Black beans, cheese, pico de gallo, sour cream, guacamole",
    items: [
      { name: "Ground Beef", price: 13.00 },
      { name: "Chicken", price: 13.00 },
      { name: "Steak (Top Sirloin)", price: 14.00 },
      { name: "Shrimp", price: 14.00 },
      { name: "Pastor", price: 14.00 },
      { name: "Chorizo", price: 14.00 },
      { name: "Carnitas", price: 14.00 },
      { name: "Birria (Brisket, Short Rib)", price: 14.00 },
      { name: "Tinga (Spicy Chicken)", price: 13.00 },
    ],
  },
  {
    id: "enchiladas",
    name: "Enchiladas",
    badgeColor: "badge-green",
    description: "Corn/flour tortilla, green/red suace, lettuce, sour cream, rice & beans on the side",
    items: [
      { name: "Chicken", price: 14.00 },
      { name: "Steak (Top Sirloin)", price: 15.00 },
      { name: "Shrimp", price: 15.00 },
      { name: "Pastor", price: 15.00 },
      { name: "Chorizo", price: 15.00 },
      { name: "Carnitas", price: 14.00 },
      { name: "Birria (Brisket, Short Rib)", price: 15.00 },
      { name: "Tinga (Spicy Chicken)", price: 14.00 },
    ],
  },
];
