import { Supplier } from '../types';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    name: 'Amina Fabrics Cotonou',
    location: 'Dantokpa Market, Cotonou',
    country: 'Benin',
    avatar: 'bg-teal-500 text-white',
    category: 'Textiles & Ankara Wax',
    localCurrency: 'XOF',
    escrowAddress: 'GAMINAFABRICSCOT2026XOFXXESCROW',
    rating: 4.9,
    completedTrades: 142,
    catalog: [
      {
        id: 'cat_1_1',
        name: 'Premium Dutch Wax (6 Yards)',
        priceLocal: 45000, // XOF
        priceUSDC: 75,
        image: '👕'
      },
      {
        id: 'cat_1_2',
        name: 'Vlisco Super-Wax Special',
        priceLocal: 90000, // XOF
        priceUSDC: 150,
        image: '👗'
      },
      {
        id: 'cat_1_3',
        name: 'Guangzhou Brocade Lace',
        priceLocal: 60000, // XOF
        priceUSDC: 100,
        image: '🧶'
      }
    ]
  },
  {
    id: 'sup_2',
    name: 'Kofi Shoe Wholesalers Accra',
    location: 'Kantanto Market, Accra',
    country: 'Ghana',
    avatar: 'bg-amber-500 text-white',
    category: 'Footwear & Leather',
    localCurrency: 'GHS',
    escrowAddress: 'GKOFISHOEACCRA2026GHSXXESCROW',
    rating: 4.8,
    completedTrades: 89,
    catalog: [
      {
        id: 'cat_2_1',
        name: 'Leather Sandals (Carton of 12)',
        priceLocal: 1200, // GHS
        priceUSDC: 95,
        image: '👡'
      },
      {
        id: 'cat_2_2',
        name: 'Men’s Classic Oxfords (Carton of 6)',
        priceLocal: 2500, // GHS
        priceUSDC: 198,
        image: '👞'
      },
      {
        id: 'cat_2_3',
        name: 'Canvas Sports Sneaker Mix',
        priceLocal: 1800, // GHS
        priceUSDC: 142,
        image: '👟'
      }
    ]
  },
  {
    id: 'sup_3',
    name: 'Mama Florence Cosmetics Nairobi',
    location: 'Eastleigh, Nairobi',
    country: 'Kenya',
    avatar: 'bg-rose-500 text-white',
    category: 'Beauty & Personal Care',
    localCurrency: 'KES',
    escrowAddress: 'GMAMAFLORENCENB2026KESXXESCROW',
    rating: 4.7,
    completedTrades: 210,
    catalog: [
      {
        id: 'cat_3_1',
        name: 'Organic Shea Butter Cream (Box of 24)',
        priceLocal: 10500, // KES
        priceUSDC: 80,
        image: '🧴'
      },
      {
        id: 'cat_3_2',
        name: 'African Black Soap Luxury Pack',
        priceLocal: 6500, // KES
        priceUSDC: 50,
        image: '🧼'
      },
      {
        id: 'cat_3_3',
        name: 'Wig & Hair Extension Bundle',
        priceLocal: 32800, // KES
        priceUSDC: 250,
        image: '💇'
      }
    ]
  },
  {
    id: 'sup_4',
    name: 'Aba Shoe Wholesalers Lagos',
    location: 'Balogun Market, Lagos',
    country: 'Nigeria',
    avatar: 'bg-blue-500 text-white',
    category: 'Handcrafted Goods',
    localCurrency: 'NGN',
    escrowAddress: 'GABASHOELAGOS2026NGNXXESCROW',
    rating: 4.9,
    completedTrades: 345,
    catalog: [
      {
        id: 'cat_4_1',
        name: 'Handmade Leather Belt (Pack of 50)',
        priceLocal: 150000, // NGN
        priceUSDC: 100,
        image: 'ベルト'
      },
      {
        id: 'cat_4_2',
        name: 'Premium Leather Boots (Carton of 10)',
        priceLocal: 450000, // NGN
        priceUSDC: 300,
        image: '👢'
      }
    ]
  }
];
