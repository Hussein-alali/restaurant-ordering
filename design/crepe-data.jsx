const CC_CATS = [
  { id: 'chicken_crepe', name: 'كريب فراخ' },
  { id: 'meat_crepe', name: 'كريب لحوم' },
  { id: 'mix_crepe', name: 'كريب ميكس' },
  { id: 'pizza', name: 'بيتزا' },
  { id: 'burger', name: 'برجر' },
  { id: 'shawarma', name: 'شاورما' },
  { id: 'meals', name: 'وجبات' },
  { id: 'addations', name: 'الأضافات' }
];

// Reusing some Unsplash food images
const IMAGES = {
  crepe: 'https://images.unsplash.com/photo-1519671282429-b44660ead0a7?auto=format&fit=crop&q=80&w=400',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
  shawarma: 'https://images.unsplash.com/photo-1648823153736-9a2b604a1b06?auto=format&fit=crop&q=80&w=400',
  fries: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400',
  meal: 'https://images.unsplash.com/photo-1626804475297-41609ea0aa4d?auto=format&fit=crop&q=80&w=400',
  sauce: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&q=80&w=400'
};

const CC_MENU = [
  // كريب فراخ
  { id: 'c1', cat: 'chicken_crepe', name: 'كريب بانيه (ناجيتس)', price: 80, img: IMAGES.crepe, tags: [] },
  { id: 'c2', cat: 'chicken_crepe', name: 'كريب كرسبي', price: 90, img: IMAGES.crepe, tags: ['hot', 'popular'] },
  { id: 'c3', cat: 'chicken_crepe', name: 'كريب شيش', price: 125, img: IMAGES.crepe, tags: [] },
  { id: 'c4', cat: 'chicken_crepe', name: 'كريب استربس', price: 130, img: IMAGES.crepe, tags: ['hot'] },
  { id: 'c5', cat: 'chicken_crepe', name: 'كريب فاهيتا فراخ', price: 125, img: IMAGES.crepe, tags: [] },
  { id: 'c6', cat: 'chicken_crepe', name: 'كريب زنجر', price: 130, img: IMAGES.crepe, tags: ['hot', 'popular'] },
  { id: 'c7', cat: 'chicken_crepe', name: 'كريب شاورما سوري', price: 130, img: IMAGES.crepe, tags: [] },
  { id: 'c8', cat: 'chicken_crepe', name: 'كريب سوبر كرانشي', price: 130, img: IMAGES.crepe, tags: ['signature'] },
  { id: 'c9', cat: 'chicken_crepe', name: 'كريب شيش استربس', price: 135, img: IMAGES.crepe, tags: [] },
  { id: 'c10', cat: 'chicken_crepe', name: 'كريب البروفيسور', price: 130, img: IMAGES.crepe, tags: ['signature'] },

  // كريب لحوم
  { id: 'm1', cat: 'meat_crepe', name: 'كريب سوسيس', price: 110, img: IMAGES.crepe, tags: [] },
  { id: 'm2', cat: 'meat_crepe', name: 'كريب هوت دوج', price: 110, img: IMAGES.crepe, tags: [] },
  { id: 'm3', cat: 'meat_crepe', name: 'كريب كفته', price: 125, img: IMAGES.crepe, tags: [] },
  { id: 'm4', cat: 'meat_crepe', name: 'كريب سجق', price: 120, img: IMAGES.crepe, tags: ['popular'] },
  { id: 'm5', cat: 'meat_crepe', name: 'كريب بسطرمه', price: 150, img: IMAGES.crepe, tags: [] },
  { id: 'm6', cat: 'meat_crepe', name: 'كريب لحم مفروم', price: 125, img: IMAGES.crepe, tags: [] },
  { id: 'm7', cat: 'meat_crepe', name: 'كريب برجر لحم', price: 125, img: IMAGES.crepe, tags: [] },

  // كريب ميكس
  { id: 'x1', cat: 'mix_crepe', name: 'كريب ميكس فراخ', price: 125, img: IMAGES.crepe, tags: ['popular'] },
  { id: 'x2', cat: 'mix_crepe', name: 'كريب ميكس لحوم', price: 130, img: IMAGES.crepe, tags: [] },
  { id: 'x3', cat: 'mix_crepe', name: 'كريب كورنر', price: 160, img: IMAGES.crepe, tags: ['signature', 'popular'] },
  { id: 'x4', cat: 'mix_crepe', name: 'كريب أبو عبيدة', price: 130, img: IMAGES.crepe, tags: ['hot'] },
  { id: 'x5', cat: 'mix_crepe', name: 'كريب 777', price: 130, img: IMAGES.crepe, tags: ['signature'] },

  // بيتزا
  { id: 'p1', cat: 'pizza', name: 'بيتزا مارجريتا', price: 125, img: IMAGES.pizza, tags: [] },
  { id: 'p2', cat: 'pizza', name: 'بيتزا خضار', price: 125, img: IMAGES.pizza, tags: [] },
  { id: 'p3', cat: 'pizza', name: 'بيتزا مكس جبن', price: 145, img: IMAGES.pizza, tags: ['popular'] },
  { id: 'p4', cat: 'pizza', name: 'بيتزا مكس فراخ', price: 150, img: IMAGES.pizza, tags: [] },
  { id: 'p5', cat: 'pizza', name: 'بيتزا فراخ باربيكيو', price: 150, img: IMAGES.pizza, tags: ['popular'] },
  { id: 'p6', cat: 'pizza', name: 'بيتزا تشيكن رانش', price: 155, img: IMAGES.pizza, tags: ['signature'] },
  { id: 'p7', cat: 'pizza', name: 'بيتزا استربس', price: 150, img: IMAGES.pizza, tags: [] },
  { id: 'p8', cat: 'pizza', name: 'بيتزا مكس لحوم', price: 155, img: IMAGES.pizza, tags: [] },
  { id: 'p9', cat: 'pizza', name: 'بيتزا سوبريم', price: 155, img: IMAGES.pizza, tags: ['signature'] },
  { id: 'p10', cat: 'pizza', name: 'بيتزا سوسيس', price: 145, img: IMAGES.pizza, tags: [] },
  { id: 'p11', cat: 'pizza', name: 'بيتزا نصين', price: 170, img: IMAGES.pizza, tags: [] },
  { id: 'p12', cat: 'pizza', name: 'بيتزا بيبروني', price: 140, img: IMAGES.pizza, tags: [] },
  { id: 'p13', cat: 'pizza', name: 'بيتزا زنجر', price: 155, img: IMAGES.pizza, tags: ['hot'] },
  { id: 'p14', cat: 'pizza', name: 'بيتزا سجق', price: 145, img: IMAGES.pizza, tags: [] },

  // برجر
  { id: 'b1', cat: 'burger', name: 'اورجينال برجر', price: 125, img: IMAGES.burger, tags: [] },
  { id: 'b2', cat: 'burger', name: 'تشيز برجر', price: 135, img: IMAGES.burger, tags: ['popular'] },
  { id: 'b3', cat: 'burger', name: 'تشيز تشيز', price: 140, img: IMAGES.burger, tags: [] },
  { id: 'b4', cat: 'burger', name: 'مشروم برجر', price: 145, img: IMAGES.burger, tags: [] },
  { id: 'b5', cat: 'burger', name: 'هالبينو برجر', price: 140, img: IMAGES.burger, tags: ['hot'] },
  { id: 'b6', cat: 'burger', name: 'بيف بيكو', price: 150, img: IMAGES.burger, tags: ['signature'] },
  { id: 'b7', cat: 'burger', name: 'بيتزا برجر', price: 150, img: IMAGES.burger, tags: [] },

  // شاورما
  { id: 's1', cat: 'shawarma', name: 'ساندوتش شاورما وسط', price: 75, img: IMAGES.shawarma, tags: [] },
  { id: 's2', cat: 'shawarma', name: 'ساندوتش شاورما كبير', price: 90, img: IMAGES.shawarma, tags: ['popular'] },
  { id: 's3', cat: 'shawarma', name: 'ساندوتش ميكس شاورما بطاطس', price: 85, img: IMAGES.shawarma, tags: [] },
  { id: 's4', cat: 'shawarma', name: 'ساندوتش بطاطس سوري', price: 40, img: IMAGES.shawarma, tags: [] },
  { id: 's5', cat: 'shawarma', name: 'ساندوتش بطاطس موزريلا', price: 60, img: IMAGES.shawarma, tags: [] },

  // وجبات
  { id: 'w1', cat: 'meals', name: 'وجبه عربي', price: 110, img: IMAGES.meal, tags: [] },
  { id: 'w2', cat: 'meals', name: 'وجبه اكسترا', price: 140, img: IMAGES.meal, tags: ['popular'] },
  { id: 'w3', cat: 'meals', name: 'وجبه الدبل', price: 180, img: IMAGES.meal, tags: [] },
  { id: 'w4', cat: 'meals', name: 'فته شاورما كبير', price: 150, img: IMAGES.meal, tags: ['signature'] },
  { id: 'w5', cat: 'meals', name: 'كيلو الشاورما', price: 700, img: IMAGES.meal, tags: ['family'] },
];

const CC_ADDONS = [
  { id: 'a1', name: 'باكت بطاطس', price: 30, img: IMAGES.fries },
  { id: 'a2', name: 'بطاطس شيدر', price: 40, img: IMAGES.fries },
  { id: 'a3', name: 'تشكن كرسبي فرايز', price: 65, img: IMAGES.fries },
  { id: 'a4', name: 'تشيلي تشيز فرايز', price: 65, img: IMAGES.fries },
  { id: 'a5', name: 'إضافة لحوم للبيتزا', price: 35, img: IMAGES.pizza },
  { id: 'a6', name: 'إضافة جبن موتزاريلا للبيتزا', price: 30, img: IMAGES.pizza },
  { id: 'a7', name: 'إضافة لحوم للكريب', price: 30, img: IMAGES.crepe },
  { id: 'a8', name: 'إضافة جبن للكريب', price: 25, img: IMAGES.crepe },
  { id: 'a9', name: 'إضافة بطاطس للكريب', price: 10, img: IMAGES.fries },
  { id: 'a10', name: 'كلو سلو', price: 15, img: IMAGES.sauce },
  { id: 'a11', name: 'علبة تومية', price: 10, img: IMAGES.sauce },
  { id: 'a12', name: 'علبة تومية حار', price: 10, img: IMAGES.sauce },
  { id: 'a13', name: 'علبة مخلل', price: 10, img: IMAGES.sauce },
];

Object.assign(window, { CC_CATS, CC_MENU, CC_ADDONS, IMAGES });
