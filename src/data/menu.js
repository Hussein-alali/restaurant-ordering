const cU = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`

const IMG = {
  crepeChicken: cU('1626700051175-6818013e1d4f'),
  crepeMeat:    cU('1599487488170-d11ec9c172f0'),
  crepeMix:     cU('1565299624946-b28f40a0ae38'),
  crepeSpicy:   cU('1606755962773-d324e0a13086'),
  crepeShish:   cU('1565958011703-44f9829ba187'),
  pizza:        cU('1574071318508-1cdbab80d002'),
  pizzaMargh:   cU('1604382354936-07c5d9983bd3'),
  pizzaMix:     cU('1565299624946-b28f40a0ae38'),
  pizzaPep:     cU('1628840042765-356cda07504e'),
  burger:       cU('1568901346375-23c9450c58cd'),
  burgerCheese: cU('1606131731446-5568d87113aa'),
  burgerMush:   cU('1551782450-a2132b4ba21d'),
  shawarmaSan:  cU('1633321702518-7feccafb94d5'),
  shawarmaPlt:  cU('1631515243349-e0cb75fb8d3a'),
  fries:        cU('1573080496219-bb080dd4f877'),
  meal:         cU('1571091718767-18b5b1457add'),
}

export const CATS = [
  { id: 'crepe-chicken', ar: 'كريب فراخ' },
  { id: 'crepe-meat',    ar: 'كريب لحوم' },
  { id: 'crepe-mix',     ar: 'كريب ميكس' },
  { id: 'pizza',         ar: 'بيتزا كورنر' },
  { id: 'burger',        ar: 'بيف برجر' },
  { id: 'shawarma',      ar: 'الشاورما' },
  { id: 'meals',         ar: 'وجبات' },
]

export const ADDONS = [
  { name: 'باكت بطاطس',                price: 30 },
  { name: 'بطاطس شيدر',                price: 40 },
  { name: 'تشيكن كرسبي فرايز',         price: 65 },
  { name: 'تشيلي تشيز فرايز',          price: 65 },
  { name: 'إضافة لحوم للبيتزا',         price: 35 },
  { name: 'إضافة جبن موزريلا للبيتزا',  price: 30 },
  { name: 'إضافة لحوم للكريب',          price: 30 },
  { name: 'إضافة جبن للكريب',           price: 25 },
  { name: 'إضافة بطاطس للكريب',         price: 10 },
  { name: 'كول سلو',                    price: 15 },
  { name: 'علبة تومية',                 price: 10 },
  { name: 'علبة تومية حار',             price: 10 },
  { name: 'علبة مخلل',                  price: 10 },
]

const menu = [
  // ───── كريب فراخ ─────
  { id: 1,  cat: 'crepe-chicken', name: 'كريب بانيه (ناجيتس)',        price: 80,  image: IMG.crepeChicken, tags: [],            desc: '' },
  { id: 2,  cat: 'crepe-chicken', name: 'كريب كرسبي (ناجيتس / حار)',  price: 90,  image: IMG.crepeSpicy,   tags: ['hot'],        desc: '' },
  { id: 3,  cat: 'crepe-chicken', name: 'كريب شيش',                   price: 125, image: IMG.crepeShish,   tags: [],             desc: '' },
  { id: 4,  cat: 'crepe-chicken', name: 'كريب استرس (حار)',            price: 130, image: IMG.crepeSpicy,   tags: ['hot'],        desc: '' },
  { id: 5,  cat: 'crepe-chicken', name: 'كريب فاهيتا فراخ',           price: 125, image: IMG.crepeChicken, tags: [],             desc: '' },
  { id: 6,  cat: 'crepe-chicken', name: 'كريب زنجر (حار)',             price: 130, image: IMG.crepeSpicy,   tags: ['hot'],        desc: '' },
  { id: 7,  cat: 'crepe-chicken', name: 'كريب شاورما سوري',            price: 130, image: IMG.shawarmaSan,  tags: [],             desc: '' },
  { id: 8,  cat: 'crepe-chicken', name: 'كريب سوبر كرانشي',            price: 130, image: IMG.crepeChicken, tags: ['popular'],    desc: '' },
  { id: 9,  cat: 'crepe-chicken', name: 'كريب شيش استرس',              price: 135, image: IMG.crepeShish,   tags: [],             desc: '' },
  { id: 10, cat: 'crepe-chicken', name: 'كريب البروفيسور',             price: 150, image: IMG.crepeChicken, tags: ['signature'],  desc: '' },

  // ───── كريب لحوم ─────
  { id: 11, cat: 'crepe-meat', name: 'كريب سوسيس',      price: 110, image: IMG.crepeMeat, tags: [],          desc: '' },
  { id: 12, cat: 'crepe-meat', name: 'كريب هوت دوج',    price: 110, image: IMG.crepeMeat, tags: [],          desc: '' },
  { id: 13, cat: 'crepe-meat', name: 'كريب كفته',       price: 125, image: IMG.crepeMeat, tags: [],          desc: '' },
  { id: 14, cat: 'crepe-meat', name: 'كريب سجق',        price: 120, image: IMG.crepeMeat, tags: [],          desc: '' },
  { id: 15, cat: 'crepe-meat', name: 'كريب بسطرمة',     price: 150, image: IMG.crepeMeat, tags: [],          desc: '' },
  { id: 16, cat: 'crepe-meat', name: 'كريب لحم مفروم',  price: 125, image: IMG.crepeMeat, tags: [],          desc: '' },
  { id: 17, cat: 'crepe-meat', name: 'كريب برجر لحم',   price: 125, image: IMG.crepeMeat, tags: [],          desc: '' },

  // ───── كريب ميكس ─────
  { id: 18, cat: 'crepe-mix', name: 'كريب ميكس فراخ',       price: 125, image: IMG.crepeMix,   tags: ['popular'],   desc: 'شيش · استرس · بانيه ناجيتس · فلفل · طماطم · كاتشب ومايونيز' },
  { id: 19, cat: 'crepe-mix', name: 'كريب ميكس لحوم',       price: 130, image: IMG.crepeMix,   tags: [],            desc: 'لحم مفروم · سوسيس · سجق · موزريلا · فلفل · طماطم · كاتشب ومايونيز' },
  { id: 20, cat: 'crepe-mix', name: 'كريب كورنر',           price: 160, image: IMG.crepeMix,   tags: ['signature'], desc: 'سجق · لحم مفروم · سوسيس · بانيه · شيش · استرس · بطاطس · جبنة موزريلا · صوص شيدر · كاتشب ومايونيز' },
  { id: 21, cat: 'crepe-mix', name: 'كريب ابو عبيدة (حار)', price: 130, image: IMG.crepeSpicy, tags: ['hot'],       desc: 'ثلاث قطع صدور فراخ · ثلاث صوانيم موزريلا · جبنة موزريلا · كاتشب ومايونيز' },
  { id: 22, cat: 'crepe-mix', name: 'كريب 777',             price: 130, image: IMG.crepeMix,   tags: [],            desc: 'شيش مدخن · استرس · سوسيس مكرمل · روز بيف · جبنة موزريلا · صوص شيدر' },

  // ───── بيف برجر ─────
  { id: 46, cat: 'burger', name: 'اورجينال برجر',  price: 125, image: IMG.burger,      tags: [],          desc: 'قطعة لحم مشوية · خس · طماطم · خيار مخلل · صوص كوكتيل' },
  { id: 47, cat: 'burger', name: 'تشيز برجر',      price: 135, image: IMG.burgerCheese, tags: ['popular'], desc: 'قطعة لحم مشوية · خس · طماطم · بصل · خيار مخلل · شريحة جبن أمريكانا · صوص كوكتيل' },
  { id: 48, cat: 'burger', name: 'تشيز تشيز',      price: 140, image: IMG.burgerCheese, tags: [],          desc: 'قطعة لحم مشوية · خس · طماطم · بصل · خيار مخلل · مكس من الجبن · صوص شيدر' },
  { id: 49, cat: 'burger', name: 'مشروم برجر',     price: 145, image: IMG.burgerMush,   tags: [],          desc: 'قطعة لحم مشوية · خس · طماطم · بصل · خيار مخلل · مكس من الجبن · مشروم · صوص باربيكيو' },
  { id: 23, cat: 'burger', name: 'هالبينو برجر',   price: 140, image: IMG.burger,       tags: ['hot'],     desc: 'قطعة لحم مشوية · خس · طماطم · بصل · خيار مخلل · فلفل هالبينو حار · شريحة جبن أمريكانا · صوص شيلي الحار' },
  { id: 24, cat: 'burger', name: 'بيف بيكو',       price: 150, image: IMG.burgerCheese, tags: [],          desc: 'قطعة لحم مشوية · خس · طماطم · بصل · خيار مخلل · هوت دوج · فلفل ألوان · مشروم · صوص باربيكيو · شريحة جبن أمريكانا' },
  { id: 25, cat: 'burger', name: 'بيتزا برجر',     price: 150, image: IMG.pizzaMargh,   tags: [],          desc: 'عجينة كورنر الخاصة · قطعة لحم · جبنة موزريلا · صوص شيدر · فلفل ألوان · زيتون' },

  // ───── بيتزا كورنر (sizes: وسط / كبير) ─────
  { id: 26, cat: 'pizza', name: 'بيتزا مارجريتا',       price: 125, sizes: [{ key: 'وسط', price: 125 }, { key: 'كبير', price: 145 }], image: IMG.pizzaMargh, tags: [],            desc: 'موتزريلا · زيتون · طماطم · ريحان' },
  { id: 27, cat: 'pizza', name: 'بيتزا خضار',           price: 125, sizes: [{ key: 'وسط', price: 125 }, { key: 'كبير', price: 145 }], image: IMG.pizza,      tags: [],            desc: 'موتزريلا · مشروم · فلفل ألوان · طماطم · خضار طازجة' },
  { id: 28, cat: 'pizza', name: 'بيتزا مكس جبن',        price: 145, sizes: [{ key: 'وسط', price: 145 }, { key: 'كبير', price: 160 }], image: IMG.pizza,      tags: [],            desc: 'موتزريلا · كريمة · شيدر · فيتا · زيتون · رومي' },
  { id: 29, cat: 'pizza', name: 'بيتزا مكس فراخ',       price: 150, sizes: [{ key: 'وسط', price: 150 }, { key: 'كبير', price: 165 }], image: IMG.pizza,      tags: [],            desc: 'موتزريلا · فراخ مشوية · فلفل ألوان · كاتشب · طماطم' },
  { id: 30, cat: 'pizza', name: 'بيتزا فراخ باربيكيو',  price: 150, sizes: [{ key: 'وسط', price: 150 }, { key: 'كبير', price: 165 }], image: IMG.pizza,      tags: ['popular'],   desc: 'موتزريلا · فراخ باربيكيو · بصل · فلفل ألوان · صوص باربيكيو' },
  { id: 31, cat: 'pizza', name: 'بيتزا تشيكن رانش',     price: 155, sizes: [{ key: 'وسط', price: 155 }, { key: 'كبير', price: 170 }], image: IMG.pizza,      tags: [],            desc: 'موتزريلا · فراخ مشوية · بصل · فلفل ألوان · صوص رانش' },
  { id: 32, cat: 'pizza', name: 'بيتزا استرس',          price: 145, sizes: [{ key: 'وسط', price: 145 }, { key: 'كبير', price: 160 }], image: IMG.pizzaPep,   tags: ['hot'],       desc: 'موتزريلا · فراخ حار · فلفل حار · صوص شيلي' },
  { id: 33, cat: 'pizza', name: 'بيتزا مكس لحوم',       price: 155, sizes: [{ key: 'وسط', price: 155 }, { key: 'كبير', price: 170 }], image: IMG.pizzaMix,   tags: [],            desc: 'موتزريلا · لحوم مشكلة · سجق · سوسيس · فلفل ألوان · طماطم' },
  { id: 34, cat: 'pizza', name: 'بيتزا سوبريم',         price: 155, sizes: [{ key: 'وسط', price: 155 }, { key: 'كبير', price: 170 }], image: IMG.pizzaMix,   tags: [],            desc: 'موتزريلا · لحوم مشكلة · خضار متنوعة · فلفل ألوان · طماطم' },
  { id: 35, cat: 'pizza', name: 'بيتزا سوسيس',          price: 145, sizes: [{ key: 'وسط', price: 145 }, { key: 'كبير', price: 160 }], image: IMG.pizzaPep,   tags: [],            desc: 'موتزريلا · سوسيس · فلفل ألوان · طماطم · زيتون' },
  { id: 36, cat: 'pizza', name: 'بيتزا نصين (اختيارك)', price: 170, sizes: [{ key: 'وسط', price: 170 }, { key: 'كبير', price: 185 }], image: IMG.pizza,      tags: [],            desc: 'نصفين من اختيارك' },
  { id: 37, cat: 'pizza', name: 'بيتزا بيبروني',        price: 140, sizes: [{ key: 'وسط', price: 140 }, { key: 'كبير', price: 155 }], image: IMG.pizzaPep,   tags: ['popular'],   desc: 'موتزريلا · بيبروني · طماطم · زيتون' },
  { id: 38, cat: 'pizza', name: 'بيتزا زنجر',           price: 155, sizes: [{ key: 'وسط', price: 155 }, { key: 'كبير', price: 170 }], image: IMG.pizzaPep,   tags: ['hot'],       desc: 'موتزريلا · فراخ زنجر حار · فلفل ألوان · طماطم' },
  { id: 39, cat: 'pizza', name: 'بيتزا سجق',            price: 145, sizes: [{ key: 'وسط', price: 145 }, { key: 'كبير', price: 160 }], image: IMG.pizzaPep,   tags: [],            desc: 'موتزريلا · سجق · فلفل ألوان · طماطم · زيتون' },
  { id: 40, cat: 'pizza', name: 'بيتزا مفروم',          price: 145, sizes: [{ key: 'وسط', price: 145 }, { key: 'كبير', price: 160 }], image: IMG.pizza,      tags: [],            desc: 'موتزريلا · لحم مفروم · فلفل ألوان · زيتون · طماطم' },
  { id: 41, cat: 'pizza', name: 'بيتزا تشيكن هالبينو',  price: 150, sizes: [{ key: 'وسط', price: 150 }, { key: 'كبير', price: 165 }], image: IMG.pizza,      tags: ['hot'],       desc: 'موتزريلا · فراخ مشوية · فلفل هالبينو حار · كاتشب · طماطم' },
  { id: 42, cat: 'pizza', name: 'بيتزا جمبري',          price: 180, sizes: [{ key: 'وسط', price: 180 }, { key: 'كبير', price: 200 }], image: IMG.pizza,      tags: ['signature'], desc: 'موتزريلا · جمبري · فلفل ألوان · زيتون · طماطم' },
  { id: 43, cat: 'pizza', name: 'بيتزا جمبري رانش',     price: 175, sizes: [{ key: 'وسط', price: 175 }, { key: 'كبير', price: 210 }], image: IMG.pizza,      tags: ['signature'], desc: 'موتزريلا · جمبري · صوص رانش · فلفل ألوان · طماطم' },
  { id: 44, cat: 'pizza', name: 'بيتزا تونة',           price: 175, sizes: [{ key: 'وسط', price: 175 }, { key: 'كبير', price: 190 }], image: IMG.pizza,      tags: [],            desc: 'موتزريلا · تونة · زيتون · فلفل ألوان · طماطم' },

  // ───── الشاورما ─────
  { id: 50, cat: 'shawarma', name: 'ساندوتش شاورما وسط',         price: 75,  image: IMG.shawarmaSan, tags: [],          desc: '' },
  { id: 51, cat: 'shawarma', name: 'ساندوتش شاورما كبير',        price: 90,  image: IMG.shawarmaSan, tags: ['popular'], desc: '' },
  { id: 52, cat: 'shawarma', name: 'ساندوتش ميكس شاورما بطاطس',  price: 85,  image: IMG.shawarmaSan, tags: [],          desc: '' },
  { id: 53, cat: 'shawarma', name: 'ساندوتش بطاطس سوري',         price: 40,  image: IMG.fries,       tags: [],          desc: '' },
  { id: 54, cat: 'shawarma', name: 'ساندوتش بطاطس موزريلا',      price: 60,  image: IMG.fries,       tags: [],          desc: '' },

  // ───── وجبات ─────
  { id: 55, cat: 'meals', name: 'وجبة عربي',       price: 110, image: IMG.meal,        tags: [],          desc: '٦ قطع + تومية + بطاطس + مخلل' },
  { id: 56, cat: 'meals', name: 'وجبة اكسترا',     price: 140, image: IMG.meal,        tags: [],          desc: '٩ قطع + تومية + بطاطس + مخلل' },
  { id: 57, cat: 'meals', name: 'وجبة الديل',      price: 180, image: IMG.meal,        tags: ['popular'], desc: '١٢ قطعة + تومية + بطاطس + مخلل' },
  { id: 58, cat: 'meals', name: 'فتة شاورما كبير', price: 150, image: IMG.shawarmaPlt, tags: [],          desc: '' },
  { id: 59, cat: 'meals', name: 'كيلو الشاورما',   price: 700, image: IMG.shawarmaPlt, tags: ['family'],  desc: '٤ عيش سوري + بطاطس + تومية + كول سلو' },
]

export default menu
