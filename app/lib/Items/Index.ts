export type ItemRarity =
    | 'Common'
    | 'Rare'
    | 'Epic'
    | 'Legendary';

export type ItemCategory =
    | 'Weapon'
    | 'Armor'
    | 'Potion'
    | 'Artifact'
    | 'Magic'
    | 'Consumable';

export type Item = {
    id: string;
    name: string;
    description: string;
    category: ItemCategory;
    rarity: ItemRarity;
    price: number;
    stock: number;
    image: string;
    attributes: {
        attack?: number;
        defense?: number;
        magic?: number;
        healing?: number;
        durability?: number;
    };
    metadata: string;
};

export const ITEMS: Item[] = [
    {
        id: 'iron_sword',
        name: 'Iron Sword',
        description:
            'A reliable sword forged by the blacksmiths of Eldoria.',
        category: 'Weapon',
        rarity: 'Common',
        price: 5,
        stock: 100,
        image: 'https://amethyst-implicit-silkworm-944.mypinata.cloud/ipfs/bafkreibziwxz34p4kmnkkso4yt4xxslqkyamyas4zmf3xmqk4ivwgiei5y',
        attributes: {
            attack: 12,
            durability: 40,
        },
        metadata: 'ipfs://bafkreiex5r3k4ejy7qv4xeg3sishob6ytnck23j4irjt7jkanifdb75spi'
    },

    {
        id: 'steel_greatsword',
        name: 'Steel Greatsword',
        description:
        'A heavy two-handed blade capable of crushing armor.',
        category: 'Weapon',
        rarity: 'Rare',
        price: 12,
        stock: 30,
        image: 'https://amethyst-implicit-silkworm-944.mypinata.cloud/ipfs/bafybeie6ovh4fxbi2zqe53cpa277xlxnrolv2zr5k52hfsubomzx7jj3x4',
        attributes: {
            attack: 28,
            durability: 80,
        },
        metadata: 'ipfs://bafkreidvep2d6rzy3yd3psjhk7zlqfvew56jbxeha26jhiwepwobuguphi'
    },

    {
        id: 'shadow_dagger',
        name: 'Shadow Dagger',
        description:
        'A cursed dagger favored by assassins of the night.',
        category: 'Weapon',
        rarity: 'Epic',
        price: 20,
        stock: 10,
        image: 'https://amethyst-implicit-silkworm-944.mypinata.cloud/ipfs/bafybeiheeevky7ehocackdbfq6xktpbg4lofdrrdis3himsna6l2ilreoy',
        attributes: {
            attack: 42,
            magic: 10,
            durability: 25,
        },
        metadata: 'ipfs://bafkreigmnt3pumolwrafzwvmo6eeis7qm3jhgdkjfrz3awviz2rkrep7v4'
    },

    {
        id: 'wooden_shield',
        name: 'Wooden Shield',
        description:
        'A basic wooden shield for beginner adventurers.',
        category: 'Armor',
        rarity: 'Common',
        price: 4,
        stock: 120,
        image: 'https://amethyst-implicit-silkworm-944.mypinata.cloud/ipfs/bafybeiaqpl4dmara45m7bqu46rydnc5v54taztcdsdd35hvx5rnjgu6fve',
        attributes: {
            defense: 10,
            durability: 30,
        },
        metadata: 'ipfs://bafkreigerrcibrvpw4635b237hjxgbtrlqroujfkolxnmnhx7ijmnigevu'
    },

    {
        id: 'knight_shield',
        name: 'Knight Shield',
        description:
        'A reinforced steel shield used by royal guards.',
        category: 'Armor',
        rarity: 'Rare',
        price: 14,
        stock: 20,
        image: 'https://amethyst-implicit-silkworm-944.mypinata.cloud/ipfs/bafybeic3fwx4o5bjyx7znnxf53hx7t7xm2ehbyowfyifpyieaqsl4h4cwu',
        attributes: {
            defense: 35,
            durability: 90,
        },
        metadata: 'ipfs://bafkreidw5swjeshcfwwxoj4ivqq3vjetw4345qebhucslexzsuhdzss7uy'
    },

    {
        id: 'health_potion',
        name: 'Health Potion',
        description:
        'Restores health during dangerous battles.',
        category: 'Potion',
        rarity: 'Common',
        price: 2,
        stock: 200,
        image: 'https://amethyst-implicit-silkworm-944.mypinata.cloud/ipfs/bafkreic5auxkwwhot2wjtvqlp4i3u2h46eywiyanyj2p2bag2mvmv4kfty',
        attributes: {
            healing: 25,
        },
        metadata: 'ipfs://bafkreihp66qd6lmwjvo3hy3eod3oqvrdxnyv2byrhzne4sztv7sdjl7gqy'
    },
];