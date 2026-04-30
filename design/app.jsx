const { React, ReactDOM } = window;
const { CC_CATS, CC_MENU, CC_ADDONS, IMAGES, CCLogo, CCRibbon, CCTag, CCRow, IOSDevice, DesignCanvas, CanvasSection } = window;

// --- Components ---

const Header = () => (
  <div style={{
    background: 'linear-gradient(to right, var(--cc-red-deep), var(--cc-red))',
    color: 'white', padding: '48px 16px 16px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <CCLogo size={44} />
      <div>
        <div style={{ fontFamily: 'Rubik', fontStyle: 'italic', fontWeight: 900, color: 'var(--cc-yellow)', fontSize: '20px', lineHeight: 1 }}>Crepe Corner</div>
        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>كفر صقر · شارع المستشفى</div>
      </div>
    </div>
    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    </div>
  </div>
);

const SegmentedControl = () => (
  <div style={{ display: 'flex', backgroundColor: '#e8ddcd', padding: '4px', borderRadius: '16px', margin: '16px' }}>
    <div style={{ flex: 1, textAlign: 'center', padding: '8px', backgroundColor: 'var(--cc-yellow)', color: 'var(--cc-ink)', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      توصيل <span style={{ fontSize: '10px', opacity: 0.7 }}>(30 د)</span>
    </div>
    <div style={{ flex: 1, textAlign: 'center', padding: '8px', color: 'var(--cc-body)', fontWeight: 'bold', fontSize: '14px' }}>
      استلام <span style={{ fontSize: '10px', opacity: 0.7 }}>(15 د)</span>
    </div>
    <div style={{ flex: 1, textAlign: 'center', padding: '8px', color: 'var(--cc-body)', fontWeight: 'bold', fontSize: '14px' }}>
      محل <span style={{ fontSize: '10px', opacity: 0.7 }}>(QR)</span>
    </div>
  </div>
);

const HeroOffer = () => (
  <div style={{ margin: '0 16px 16px', backgroundColor: 'var(--cc-ink)', borderRadius: '16px', padding: '16px', color: 'white', display: 'flex', gap: '16px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden' }}>
      <img src={IMAGES.meal} alt="Offer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--cc-yellow)', color: 'var(--cc-ink)', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', alignSelf: 'flex-start', marginBottom: '4px' }}>عرض اليوم</div>
      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>وجبة الدبل</div>
      <div style={{ fontSize: '12px', color: 'var(--cc-muted)' }}>وفّر ٢٥ ج.م</div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', paddingRight: '8px' }}>
      <div className="price-text" style={{ color: 'var(--cc-yellow)', fontSize: '24px' }}>
        155 <span className="price-currency" style={{ fontSize: '12px' }}>ج.م</span>
      </div>
    </div>
  </div>
);

const CategoryStrip = ({ activeCat }) => (
  <div className="ios-content-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 16px 16px', position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--cc-bg)' }}>
    {CC_CATS.map(cat => {
      const isActive = cat.id === activeCat;
      return (
        <div key={cat.id} style={{
          padding: '8px 16px', borderRadius: '24px', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '14px',
          backgroundColor: isActive ? 'var(--cc-red)' : 'white',
          color: isActive ? 'white' : 'var(--cc-ink)',
          boxShadow: isActive ? '0 4px 12px rgba(168, 22, 12, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
        }}>
          {cat.name}
        </div>
      );
    })}
  </div>
);

// --- Menu Browse Screen ---
const MenuBrowseScreen = ({ activeCat = 'chicken_crepe', showCartBar = false }) => {
  const items = CC_MENU.filter(m => m.cat === activeCat);
  const catName = CC_CATS.find(c => c.id === activeCat)?.name;

  return (
    <div style={{ backgroundColor: 'var(--cc-bg)', minHeight: '100%', paddingBottom: showCartBar ? '100px' : '32px' }}>
      <Header />
      <SegmentedControl />
      <HeroOffer />
      <CategoryStrip activeCat={activeCat} />
      
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <CCRibbon>{catName}</CCRibbon>
          <div style={{ color: 'var(--cc-muted)', fontSize: '12px', fontWeight: 'bold' }}>{items.length} أصناف</div>
        </div>
        
        {items.map(item => <CCRow key={item.id} item={item} onClickAdd={() => {}} />)}
      </div>

      {showCartBar && (
        <div style={{
          position: 'absolute', bottom: '24px', left: '16px', right: '16px',
          backgroundColor: 'var(--cc-red)', borderRadius: '16px', color: 'white',
          padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(168, 22, 12, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--cc-yellow)', color: 'var(--cc-ink)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>عرض السلة</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>٢٨٥ ج.م · ٣٠ د</div>
            </div>
          </div>
          <div style={{ fontWeight: 'bold' }}>متابعة الطلب &larr;</div>
        </div>
      )}
    </div>
  );
};

// --- Item Detail Screen ---
const ItemDetailScreen = () => {
  return (
    <div style={{ backgroundColor: 'var(--cc-bg)', minHeight: '100%', paddingBottom: '100px' }}>
      {/* Hero Photo */}
      <div style={{ height: '340px', position: 'relative' }}>
        <img src={IMAGES.crepe} alt="Crepe Corner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)' }} />
        
        {/* Top icons */}
        <div style={{ position: 'absolute', top: '48px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
        </div>
        
        {/* Tags */}
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '8px' }}>
          <CCTag type="signature" />
          <CCTag type="popular" />
        </div>
      </div>

      <div style={{ padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1, paddingLeft: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--cc-ink)' }}>كريب كورنر</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--cc-muted)', fontSize: '13px', lineHeight: 1.5 }}>
              سجق، لحم مفروم، سوسيس، بانيه، شيش، استربس، بطاطس، جبنة موزاريلا، خضار، صوص شيدر، كاتشب ومايونيز.
            </p>
          </div>
          <div style={{ backgroundColor: 'var(--cc-red)', color: 'white', padding: '8px 12px', borderRadius: '12px', textAlign: 'center' }}>
            <div className="price-text" style={{ fontSize: '20px' }}>
              160 <span className="price-currency" style={{ color: 'var(--cc-yellow)' }}>ج.م</span>
            </div>
          </div>
        </div>

        {/* Size Selector */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--cc-ink)' }}>الحجم</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: 'white', color: 'var(--cc-body)', fontWeight: 'bold', border: '2px solid transparent' }}>وسط</div>
            <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: 'var(--cc-ink)', color: 'white', fontWeight: 'bold' }}>كبير</div>
            <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: 'white', color: 'var(--cc-body)', fontWeight: 'bold', border: '2px solid transparent' }}>عائلي</div>
          </div>
        </div>

        {/* Add-ons */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--cc-ink)' }}>إضافات</h3>
            <div style={{ color: 'var(--cc-red)', fontSize: '12px', fontWeight: 'bold' }}>عرض كل الإضافات (١٣) &larr;</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CC_ADDONS.slice(0, 6).map((addon, i) => (
              <div key={addon.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: i === 0 ? 'none' : '2px solid #ccc', backgroundColor: i === 0 ? 'var(--cc-red)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i === 0 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span style={{ fontWeight: 'bold', color: 'var(--cc-ink)', fontSize: '14px' }}>{addon.name}</span>
                </label>
                <span className="price-text" style={{ color: 'var(--cc-red)', fontSize: '14px' }}>+{addon.price} <span className="price-currency">ج.م</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--cc-ink)' }}>ملاحظات</h3>
          <textarea placeholder="بدون مايونيز · حار زيادة …" style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', backgroundColor: 'white', fontFamily: 'Cairo', fontSize: '14px', resize: 'none' }}></textarea>
        </div>
      </div>

      {/* Sticky Add Bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white', padding: '16px 24px 32px',
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', display: 'flex', gap: '16px', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--cc-bg)', padding: '8px', borderRadius: '16px' }}>
          <button style={{ width: '32px', height: '32px', border: 'none', background: 'white', borderRadius: '8px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>1</span>
          <button style={{ width: '32px', height: '32px', border: 'none', background: 'var(--cc-ink)', color: 'white', borderRadius: '8px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
        <button style={{ flex: 1, backgroundColor: 'var(--cc-red)', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <span>أضف للسلة</span>
          <span className="price-text">190 <span className="price-currency">ج.م</span></span>
        </button>
      </div>
    </div>
  );
};

// --- Cart Screen ---
const CartScreen = () => {
  return (
    <div style={{ backgroundColor: 'var(--cc-bg)', minHeight: '100%', paddingBottom: '120px' }}>
      {/* Header */}
      <div style={{ background: 'var(--cc-red)', color: 'white', padding: '48px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>السلة</div>
        <div style={{ color: 'var(--cc-yellow)', fontSize: '14px', fontWeight: 'bold' }}>مسح الكل</div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Address Card */}
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--cc-cream)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📍</div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--cc-muted)', fontWeight: 'bold' }}>التوصيل إلى</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--cc-ink)' }}>المنزل - شارع المستشفى</div>
            </div>
          </div>
          <div style={{ color: 'var(--cc-red)', fontWeight: 'bold', fontSize: '14px' }}>تغيير</div>
        </div>

        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Item 1 */}
          <div style={{ display: 'flex', gap: '12px', backgroundColor: 'white', padding: '12px', borderRadius: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={IMAGES.crepe} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: 'var(--cc-ink)', fontSize: '14px' }}>كريب كورنر</div>
              <div style={{ fontSize: '12px', color: 'var(--cc-muted)' }}>وسط، بدون مايونيز</div>
              <div className="price-text" style={{ color: 'var(--cc-red)', marginTop: '4px', fontSize: '16px' }}>160 <span className="price-currency">ج.م</span></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--cc-bg)', borderRadius: '8px', padding: '4px 8px' }}>
              <div style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>+</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>1</div>
              <div style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>−</div>
            </div>
          </div>
          {/* Item 2 */}
          <div style={{ display: 'flex', gap: '12px', backgroundColor: 'white', padding: '12px', borderRadius: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={IMAGES.burger} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: 'var(--cc-ink)', fontSize: '14px' }}>تشيز برجر</div>
              <div style={{ fontSize: '12px', color: 'var(--cc-muted)' }}>عادي</div>
              <div className="price-text" style={{ color: 'var(--cc-red)', marginTop: '4px', fontSize: '16px' }}>135 <span className="price-currency">ج.م</span></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--cc-bg)', borderRadius: '8px', padding: '4px 8px' }}>
              <div style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>+</div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>2</div>
              <div style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>−</div>
            </div>
          </div>
        </div>

        {/* Upsell Strip */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--cc-ink)' }}>تضيف معاك؟</h3>
          <div className="ios-content-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {[CC_ADDONS[0], CC_ADDONS[9], CC_ADDONS[10]].map(addon => (
              <div key={addon.id} style={{ minWidth: '100px', backgroundColor: 'white', borderRadius: '12px', padding: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '100%', height: '60px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                  <img src={addon.img} alt={addon.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addon.name}</div>
                <div className="price-text" style={{ color: 'var(--cc-red)', fontSize: '12px' }}>+{addon.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Promo */}
        <div style={{ border: '2px dashed var(--cc-yellow)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', backgroundColor: 'var(--cc-yellow-soft)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎟</span>
            <span style={{ fontWeight: 'bold', color: 'var(--cc-ink)' }}>أضف كود الخصم</span>
          </div>
          <div style={{ color: 'var(--cc-red)', fontWeight: 'bold' }}>تطبيق</div>
        </div>

        {/* Payment Picker */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--cc-ink)' }}>طريقة الدفع</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: 'var(--cc-ink)', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>💵 كاش</div>
            <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: 'white', color: 'var(--cc-body)', fontWeight: 'bold', fontSize: '14px' }}>📱 فودافون</div>
            <div style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', backgroundColor: 'white', color: 'var(--cc-body)', fontWeight: 'bold', fontSize: '14px' }}>🏦 إنستاباي</div>
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--cc-muted)' }}>المجموع</span>
            <span className="price-text">430 <span className="price-currency">ج.م</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ color: 'var(--cc-muted)' }}>التوصيل</span>
            <span className="price-text">15 <span className="price-currency">ج.م</span></span>
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--cc-rule)', marginBottom: '16px' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--cc-ink)' }}>الإجمالي</span>
            <span className="price-text" style={{ color: 'var(--cc-red)', fontSize: '24px' }}>445 <span className="price-currency">ج.م</span></span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'var(--cc-red)', color: 'white', padding: '16px 24px 32px',
        borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(168,22,12,0.3)'
      }}>
        <div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>الإجمالي · ٣ أصناف</div>
          <div className="price-text" style={{ fontSize: '20px' }}>445 <span className="price-currency" style={{ color: 'var(--cc-yellow)' }}>ج.م</span></div>
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>تأكيد الطلب &larr;</div>
      </div>
    </div>
  );
};

// --- App ---
const App = () => {
  return (
    <DesignCanvas>
      <CanvasSection title="المنيو · Menu Browse">
        <IOSDevice label="كريب فراخ">
          <MenuBrowseScreen activeCat="chicken_crepe" />
        </IOSDevice>
        <IOSDevice label="كريب لحوم">
          <MenuBrowseScreen activeCat="meat_crepe" />
        </IOSDevice>
        <IOSDevice label="كريب ميكس">
          <MenuBrowseScreen activeCat="mix_crepe" />
        </IOSDevice>
        <IOSDevice label="بيتزا">
          <MenuBrowseScreen activeCat="pizza" />
        </IOSDevice>
        <IOSDevice label="برجر">
          <MenuBrowseScreen activeCat="burger" />
        </IOSDevice>
        <IOSDevice label="شاورما">
          <MenuBrowseScreen activeCat="shawarma" />
        </IOSDevice>
        <IOSDevice label="سلة المشتريات المصغرة">
          <MenuBrowseScreen activeCat="meals" showCartBar={true} />
        </IOSDevice>
      </CanvasSection>

      <CanvasSection title="تفاصيل الصنف · Item Detail">
        <IOSDevice label="كريب كورنر">
          <ItemDetailScreen />
        </IOSDevice>
      </CanvasSection>

      <CanvasSection title="السلة · Cart">
        <IOSDevice label="مراجعة الطلب">
          <CartScreen />
        </IOSDevice>
      </CanvasSection>
    </DesignCanvas>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
