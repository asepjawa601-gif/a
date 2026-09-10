/* ================================================================
   PETALIA - CUSTOMER APP
   ================================================================ */

const Store = window.PetaliaStore;
const CATEGORIES = Store.CATEGORIES;

let products = [];
let cart = [];
let orders = [];

let currentPage = 'home';
let currentProductId = null;

let searchTerm = '';
let activeCategory = 'Semua';
let detailQty = 1;


/* ================================================================
   HELPER
   ================================================================ */

function fmtPrice(n){
  return 'Rp' + Number(n || 0).toLocaleString('id-ID');
}


function fmtDate(iso){
  const d = new Date(iso);

  return d.toLocaleString('id-ID',{
    day:'numeric',
    month:'short',
    year:'numeric',
    hour:'2-digit',
    minute:'2-digit'
  });
}


function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}


function escapeAttr(value){
  return escapeHtml(value).replace(/`/g,'&#96;');
}


function findProduct(id){
  return products.find(p => p.id === id);
}


function placeholderImg(name){
  return `https://placehold.co/400x400/FFE1EC/C43F63?text=${encodeURIComponent(
    String(name).split(' ').slice(0,2).join(' ')
  )}`;
}


function productImg(p){
  return p.image && String(p.image).trim()
    ? String(p.image).trim()
    : placeholderImg(p.name);
}


function cartQtyFor(productId){
  const item = cart.find(c => c.productId === productId);

  return item
    ? item.qty
    : 0;
}


/* ================================================================
   TOAST / NOTIFICATION
   ================================================================ */

function showToast(msg,isError = false){

  const t = document.getElementById('toast');

  if(!t) return;

  t.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5"/>
    </svg>

    <span>${escapeHtml(msg)}</span>
  `;

  t.style.background = isError
    ? '#B03A4E'
    : 'var(--text)';

  t.classList.add('show');

  clearTimeout(window._toastTimer);

  window._toastTimer = setTimeout(() => {
    t.classList.remove('show');
  },2600);
}


/* ================================================================
   STORAGE
   ================================================================ */

async function saveProducts(){
  return Store.saveProducts(products);
}


async function saveOrders(){
  return Store.saveOrders(orders);
}


async function saveCart(){
  return Store.saveCart(cart);
}


/* ================================================================
   LOAD DATA
   ================================================================ */

async function loadState(){

  [
    products,
    orders,
    cart
  ] = await Promise.all([

    Store.getProducts(),

    Store.getOrders(),

    Store.getCart()

  ]);


  /*
   * Bersihkan isi keranjang apabila:
   *
   * - produk sudah dihapus
   * - stok produk sudah habis
   * - jumlah pembelian melebihi stok
   */

  let changed = false;

  cart = cart.reduce((result,item) => {

    const p = findProduct(item.productId);

    if(!p || p.stock <= 0){

      changed = true;

      return result;
    }


    const qty = Math.min(
      Math.max(
        1,
        Number(item.qty) || 1
      ),
      p.stock
    );


    if(qty !== item.qty){

      changed = true;
    }


    result.push({
      productId:item.productId,
      qty:qty
    });


    return result;

  },[]);


  if(changed){

    await saveCart();

  }
}


/* ================================================================
   FLOWER / PETAL EFFECT
   ================================================================ */

function spawnPetals(){

  const field =
    document.getElementById('petal-field');

  if(!field) return;


  const count =
    window.innerWidth < 700
      ? 10
      : 18;


  const colors = [
    '#F6A6C1',
    '#F8BBD0',
    '#F3C6D6',
    '#E85D82'
  ];


  let html = '';


  for(let i = 0; i < count; i++){

    const left =
      Math.random() * 100;


    const size =
      10 + Math.random() * 14;


    const duration =
      11 + Math.random() * 10;


    const delay =
      Math.random() * -18;


    const drift =
      (Math.random() * 60 - 30).toFixed(0)
      + 'px';


    const color =
      colors[
        Math.floor(
          Math.random() * colors.length
        )
      ];


    html += `
      <div
        class="petal"
        style="
          left:${left}%;
          width:${size}px;
          height:${size}px;
          --drift:${drift};
          animation-duration:${duration}s;
          animation-delay:${delay}s;
        "
      >

        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
        >

          <g>

            <ellipse
              cx="10"
              cy="5"
              rx="3.4"
              ry="4.6"
              fill="${color}"
            />

            <ellipse
              cx="10"
              cy="15"
              rx="3.4"
              ry="4.6"
              fill="${color}"
            />

            <ellipse
              cx="5"
              cy="10"
              rx="4.6"
              ry="3.4"
              fill="${color}"
              opacity=".9"
            />

            <ellipse
              cx="15"
              cy="10"
              rx="4.6"
              ry="3.4"
              fill="${color}"
              opacity=".9"
            />

          </g>

        </svg>

      </div>
    `;
  }


  field.innerHTML = html;
}


/* ================================================================
   INIT
   ================================================================ */

async function init(){

  spawnPetals();

  await loadState();

  renderCategoryChips();

  renderHome();

  updateCartCount();

  showPage('home');
}


window.addEventListener(
  'DOMContentLoaded',
  init
);


/* ================================================================
   PAGE NAVIGATION
   ================================================================ */

function showPage(page){

  currentPage = page;


  document
    .querySelectorAll('.page')
    .forEach(el => {

      el.classList.remove('active');

    });


  const target =
    document.getElementById(
      'page-' + page
    );


  if(!target){

    return;
  }


  target.classList.add('active');


  document
    .querySelectorAll('.nav-btn')
    .forEach(el => {

      el.classList.remove('active');

    });


  const navMap = {

    home:'nav-home',

    cart:'nav-cart',

    orders:'nav-orders',

    detail:null

  };


  if(navMap[page]){

    document
      .getElementById(navMap[page])
      ?.classList.add('active');

  }


  window.scrollTo({

    top:0,

    behavior:'auto'

  });


  if(page === 'cart'){

    renderCart();

  }


  if(page === 'orders'){

    renderOrders();

  }

}


/* ================================================================
   SCROLL
   ================================================================ */

function scrollToCatalog(){

  const catalog =
    document.getElementById(
      'section-catalog'
    );


  if(catalog){

    catalog.scrollIntoView({

      behavior:'smooth',

      block:'start'

    });

  }

}


/* ================================================================
   CATEGORY
   ================================================================ */

function renderCategoryChips(){

  const wrap =
    document.getElementById(
      'category-chips'
    );


  if(!wrap) return;


  const cats = [
    'Semua',
    ...CATEGORIES
  ];


  wrap.innerHTML = cats.map(c => {

    const safe =
      escapeAttr(c);


    return `
      <button
        class="chip ${c === activeCategory ? 'active' : ''}"
        onclick="setCategory('${safe.replace(/'/g,"\\'")}')"
      >
        ${escapeHtml(c)}
      </button>
    `;

  }).join('');

}


function setCategory(cat){

  activeCategory = cat;

  renderCategoryChips();

  renderHome();

  scrollToCatalog();

}


/* ================================================================
   SEARCH
   ================================================================ */

function onSearchInput(val){

  searchTerm =
    String(val || '')
      .trim()
      .toLowerCase();


  renderHome();

}


function matchesFilter(p){

  const categoryMatch =
    activeCategory === 'Semua'
      || p.category === activeCategory;


  const searchMatch =
    !searchTerm
      || String(p.name)
          .toLowerCase()
          .includes(searchTerm);


  return categoryMatch
    && searchMatch;
}


/* ================================================================
   PRODUCT CARD
   ================================================================ */

function productCard(p){

  const low =
    p.stock > 0
      && p.stock <= 5;


  const out =
    p.stock <= 0;


  const inCart =
    cartQtyFor(p.id);


  return `

    <div class="card">

      <div
        class="card-media"
        onclick="openDetail('${escapeAttr(p.id)}')"
      >

        <img
          src="${escapeAttr(productImg(p))}"
          alt="${escapeAttr(p.name)}"
          loading="lazy"
        >

        ${
          low

          ? `
            <span class="badge badge-low">
              Sisa ${p.stock}
            </span>
          `

          : (

            p.sold > 300

            ? `
              <span class="badge badge-gold">
                Terlaris
              </span>
            `

            : ''
          )
        }

      </div>


      <div class="card-body">

        <div
          class="card-name"
          onclick="openDetail('${escapeAttr(p.id)}')"
        >
          ${escapeHtml(p.name)}
        </div>


        <div class="card-price">

          ${fmtPrice(p.price)}

        </div>


        <div
          class="card-stock ${low ? 'low' : ''}"
        >

          ${
            out
              ? 'Stok habis'
              : 'Stok: ' + p.stock
          }

        </div>


        <button
          class="card-add"
          ${out ? 'disabled' : ''}
          onclick="quickAdd('${escapeAttr(p.id)}')"
        >

          ${
            out

              ? 'Habis'

              : (

                inCart

                  ? `Di keranjang (${inCart})`

                  : 'Tambah ke Keranjang'

              )
          }

        </button>

      </div>

    </div>

  `;
}


/* ================================================================
   HOME
   ================================================================ */

function renderHome(){

  const searching =
    !!searchTerm;


  document.getElementById(
    'section-newest'
  ).style.display =
    searching ? 'none' : '';


  document.getElementById(
    'section-bestseller'
  ).style.display =
    searching ? 'none' : '';


  document.getElementById(
    'section-limited'
  ).style.display =
    searching ? 'none' : '';


  if(!searching){

    const newest =
      [...products]
        .sort(
          (a,b) =>
            new Date(b.addedAt)
            -
            new Date(a.addedAt)
        )
        .slice(0,4);


    const bestseller =
      [...products]
        .sort(
          (a,b) =>
            b.sold - a.sold
        )
        .slice(0,4);


    const limited =
      products.filter(
        p =>
          p.stock > 0
          &&
          p.stock <= 5
      );


    document.getElementById(
      'grid-newest'
    ).innerHTML =
      newest
        .map(productCard)
        .join('');


    document.getElementById(
      'grid-bestseller'
    ).innerHTML =
      bestseller
        .map(productCard)
        .join('');


    document.getElementById(
      'grid-limited'
    ).innerHTML =

      limited.length

        ? limited
            .map(productCard)
            .join('')

        : `
          <div
            class="empty-state"
            style="grid-column:1/-1;"
          >
            <p class="title">
              Belum ada stok yang menipis
            </p>
          </div>
        `;
  }


  const filtered =
    products.filter(
      matchesFilter
    );


  document.getElementById(
    'catalog-title'
  ).textContent =

    searching

      ? `Hasil pencarian "${
          document.getElementById(
            'search-input'
          ).value
        }"`

      : 'Semua produk';


  document.getElementById(
    'catalog-sub'
  ).textContent =

    activeCategory !== 'Semua'

      ? activeCategory

      : '';


  const catalogEl =
    document.getElementById(
      'grid-catalog'
    );


  if(!filtered.length){

    catalogEl.innerHTML = `

      <div
        class="empty-state"
        style="grid-column:1/-1;"
      >

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >

          <circle
            cx="11"
            cy="11"
            r="7"
          />

          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
          />

        </svg>

        <p class="title">
          Produk tidak ditemukan
        </p>

        <p>
          Coba kata kunci lain
          atau pilih kategori berbeda.
        </p>

      </div>

    `;

  }else{

    catalogEl.innerHTML =
      filtered
        .map(productCard)
        .join('');

  }

}


/* ================================================================
   QUICK ADD
   ================================================================ */

function quickAdd(productId){

  addToCart(
    productId,
    1
  );

}


/* ================================================================
   ADD TO CART
   ================================================================ */

async function addToCart(
  productId,
  qty
){

  const p =
    findProduct(productId);


  qty =
    Math.max(
      1,
      Number(qty) || 1
    );


  if(!p || p.stock <= 0){

    showToast(
      'Produk sedang tidak tersedia',
      true
    );

    return false;

  }


  let item =
    cart.find(
      c =>
        c.productId === productId
    );


  const current =
    item
      ? item.qty
      : 0;


  const newQty =
    Math.min(
      current + qty,
      p.stock
    );


  if(item){

    item.qty = newQty;

  }else{

    cart.push({

      productId,

      qty:newQty

    });

  }


  const saved =
    await saveCart();


  if(!saved){

    showToast(
      'Gagal menyimpan keranjang',
      true
    );

    return false;

  }


  updateCartCount();

  renderHome();


  if(currentPage === 'cart'){

    renderCart();

  }


  if(currentPage === 'detail'){

    renderDetail(
      currentProductId
    );

  }


  showToast(
    `${p.name} ditambahkan ke keranjang`
  );


  return true;
}


/* ================================================================
   UPDATE CART QUANTITY
   ================================================================ */

async function updateCartQty(
  productId,
  delta
){

  const p =
    findProduct(productId);


  const item =
    cart.find(
      c =>
        c.productId === productId
    );


  if(!item || !p){

    return;

  }


  const next =
    item.qty + delta;


  if(next <= 0){

    cart =
      cart.filter(
        c =>
          c.productId !== productId
      );

  }else{

    item.qty =
      Math.min(
        next,
        p.stock
      );

  }


  await saveCart();

  updateCartCount();

  renderCart();

  renderHome();

}


/* ================================================================
   REMOVE CART ITEM
   ================================================================ */

async function removeFromCart(
  productId
){

  cart =
    cart.filter(
      c =>
        c.productId !== productId
    );


  await saveCart();

  updateCartCount();

  renderCart();

  renderHome();

}


/* ================================================================
   CART COUNT
   ================================================================ */

function updateCartCount(){

  const totalQty =
    cart.reduce(
      (sum,c) =>
        sum + c.qty,
      0
    );


  const badge =
    document.getElementById(
      'cart-count'
    );


  if(!badge){

    return;
  }


  if(totalQty > 0){

    badge.style.display = 'flex';

    badge.textContent =
      totalQty;

  }else{

    badge.style.display = 'none';

  }

}


/* ================================================================
   RENDER CART
   ================================================================ */

function renderCart(){

  const wrap =
    document.getElementById(
      'cart-content'
    );


  if(!wrap){

    return;
  }


  if(cart.length === 0){

    wrap.innerHTML = `

      <div class="empty-state">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >

          <circle
            cx="9"
            cy="21"
            r="1"
          />

          <circle
            cx="19"
            cy="21"
            r="1"
          />

          <path
            d="M1 1h4l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"
          />

        </svg>


        <p class="title">
          Keranjangmu masih kosong
        </p>


        <p>
          Yuk, mulai pilih produk
          yang kamu suka.
        </p>


        <div
          style="margin-top:18px;"
        >

          <button
            class="btn btn-primary"
            onclick="showPage('home')"
          >
            Mulai belanja
          </button>

        </div>

      </div>

    `;

    return;
  }


  let total = 0;


  const validItems =
    cart.map(c => {

      const p =
        findProduct(
          c.productId
        );


      if(!p){

        return '';

      }


      const subtotal =
        p.price * c.qty;


      total += subtotal;


      const atMax =
        c.qty >= p.stock;


      return `

        <div class="cart-item">

          <img
            src="${escapeAttr(productImg(p))}"
            alt="${escapeAttr(p.name)}"
          >


          <div>

            <div class="cart-item-name">

              ${escapeHtml(p.name)}

            </div>


            <div class="cart-item-price">

              ${fmtPrice(p.price)}
              / item · stok ${p.stock}

            </div>


            <div
              class="qty-box small"
              style="margin-top:8px;"
            >

              <button
                onclick="updateCartQty(
                  '${escapeAttr(p.id)}',
                  -1
                )"
              >
                −
              </button>


              <span>
                ${c.qty}
              </span>


              <button
                onclick="updateCartQty(
                  '${escapeAttr(p.id)}',
                  1
                )"
                ${
                  atMax

                    ? 'disabled title="Stok maksimum tercapai"'

                    : ''
                }
              >
                +
              </button>

            </div>

          </div>


          <div class="cart-item-right">

            <div class="cart-item-subtotal">

              ${fmtPrice(subtotal)}

            </div>


            <button
              class="remove-link"
              onclick="removeFromCart(
                '${escapeAttr(p.id)}'
              )"
            >
              Hapus
            </button>

          </div>

        </div>

      `;

    })
    .join('');


  wrap.innerHTML = `

    <div class="cart-layout">

      <div>

        ${validItems}

      </div>


      <div class="summary-card">

        <h3>
          Ringkasan belanja
        </h3>


        <div class="summary-row">

          <span>
            Jumlah item
          </span>

          <span>
            ${cart.reduce(
              (s,c) =>
                s + c.qty,
              0
            )}
          </span>

        </div>


        <div class="summary-row total">

          <span>
            Total
          </span>


          <span class="amt">

            ${fmtPrice(total)}

          </span>

        </div>


        <button
          class="btn btn-primary"
          style="
            width:100%;
            margin-top:16px;
          "
          onclick="checkout()"
        >
          Checkout
        </button>

      </div>

    </div>

  `;

}


/* ================================================================
   CHECKOUT
   ================================================================ */

async function checkout(){

  if(cart.length === 0){

    showToast(
      'Keranjang masih kosong',
      true
    );

    return;
  }


  /*
   * Cek stok lagi tepat sebelum checkout.
   */

  let stockAdjusted = false;


  for(const c of cart){

    const p =
      findProduct(
        c.productId
      );


    if(!p || p.stock <= 0){

      await removeFromCart(
        c.productId
      );


      showToast(
        'Ada produk yang sudah habis dan dihapus dari keranjang',
        true
      );


      return;
    }


    if(c.qty > p.stock){

      c.qty =
        p.stock;


      stockAdjusted =
        true;

    }

  }


  if(stockAdjusted){

    await saveCart();

    renderCart();


    showToast(
      'Stok berubah. Jumlah keranjang sudah disesuaikan',
      true
    );


    return;
  }


  /*
   * Buat isi pesanan.
   */

  const orderItems =
    cart.map(c => {

      const p =
        findProduct(
          c.productId
        );


      return {

        productId:p.id,

        name:p.name,

        price:Number(
          p.price
        ),

        qty:c.qty

      };

    });


  /*
   * Hitung total.
   */

  const total =
    orderItems.reduce(
      (sum,item) =>
        sum +
        item.price *
        item.qty,
      0
    );


  /*
   * Kurangi stok dan tambah jumlah terjual.
   */

  orderItems.forEach(
    item => {

      const p =
        findProduct(
          item.productId
        );


      if(p){

        p.stock =
          Math.max(
            0,
            p.stock - item.qty
          );


        p.sold =
          (p.sold || 0)
          +
          item.qty;

      }

    }
  );


  /*
   * Buat order.
   */

  const order = {

    id:
      'ORD' +
      Date.now()
        .toString()
        .slice(-8),

    items:
      orderItems,

    total:
      total,

    time:
      new Date()
        .toISOString(),

    status:
      'Pesanan diterima'

  };


  /*
   * Simpan perubahan stok.
   */

  const productsSaved =
    await saveProducts();


  if(!productsSaved){

    /*
     * Ambil ulang data agar UI
     * tidak menampilkan data yang salah.
     */

    products =
      await Store.getProducts();


    renderHome();

    renderCart();


    showToast(
      'Checkout gagal menyimpan stok. Coba lagi.',
      true
    );


    return;
  }


  /*
   * Simpan pesanan.
   */

  orders.unshift(
    order
  );


  const ordersSaved =
    await saveOrders();


  if(!ordersSaved){

    /*
     * Stok sudah tersimpan.
     * Keranjang dikosongkan agar
     * tidak terjadi checkout ganda.
     */

    cart = [];


    await saveCart();


    updateCartCount();

    renderHome();


    showToast(
      'Stok tersimpan, tetapi riwayat pesanan gagal disimpan',
      true
    );


    showPage(
      'orders'
    );


    return;
  }


  /*
   * Checkout berhasil.
   */

  cart = [];


  await saveCart();


  updateCartCount();

  renderHome();


  /*
   * Pesan yang diminta.
   */

  showToast(
    'Pesanan terkirim'
  );


  showPage(
    'orders'
  );

}


/* ================================================================
   PRODUCT DETAIL
   ================================================================ */

function openDetail(productId){

  currentProductId =
    productId;


  detailQty =
    1;


  renderDetail(
    productId
  );


  showPage(
    'detail'
  );

}


function changeDetailQty(delta){

  const p =
    findProduct(
      currentProductId
    );


  if(!p){

    return;
  }


  detailQty =
    Math.min(

      Math.max(
        1,
        detailQty + delta
      ),

      Math.max(
        1,
        p.stock
      )

    );


  renderDetail(
    currentProductId
  );

}


function renderDetail(productId){

  const p =
    findProduct(
      productId
    );


  const wrap =
    document.getElementById(
      'detail-content'
    );


  if(!wrap){

    return;
  }


  if(!p){

    wrap.innerHTML = `

      <div class="empty-state">

        <p class="title">
          Produk tidak ditemukan
        </p>

      </div>

    `;


    return;
  }


  const out =
    p.stock <= 0;


  wrap.innerHTML = `

    <a
      class="back-link"
      onclick="showPage('home')"
      href="javascript:void(0)"
    >

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >

        <path
          d="M19 12H5"
        />

        <path
          d="M12 19l-7-7 7-7"
        />

      </svg>


      Kembali ke katalog

    </a>


    <div class="detail-grid">

      <div class="detail-media">

        <img
          src="${escapeAttr(productImg(p))}"
          alt="${escapeAttr(p.name)}"
        >

      </div>


      <div class="detail-info">

        <div class="detail-cat">

          ${escapeHtml(p.category)}

        </div>


        <h2>

          ${escapeHtml(p.name)}

        </h2>


        <div class="detail-price">

          ${fmtPrice(p.price)}

        </div>


        <div class="detail-stock">

          ${
            out
              ? 'Stok habis'
              : `Stok tersedia: ${p.stock}`
          }

        </div>


        <p class="detail-desc">

          ${
            escapeHtml(
              p.desc
              ||
              'Belum ada deskripsi untuk produk ini.'
            )
          }

        </p>


        ${
          !out

            ? `

              <div class="qty-row">

                <div class="qty-box">

                  <button
                    onclick="changeDetailQty(-1)"
                    ${
                      detailQty <= 1
                        ? 'disabled'
                        : ''
                    }
                  >
                    −
                  </button>


                  <span>
                    ${detailQty}
                  </span>


                  <button
                    onclick="changeDetailQty(1)"
                    ${
                      detailQty >= p.stock
                        ? 'disabled'
                        : ''
                    }
                  >
                    +
                  </button>

                </div>

              </div>


              <div class="detail-actions">

                <button
                  class="btn btn-outline"
                  onclick="addToCart(
                    '${escapeAttr(p.id)}',
                    ${detailQty}
                  )"
                >
                  Tambah ke Keranjang
                </button>


                <button
                  class="btn btn-primary"
                  onclick="buyNow(
                    '${escapeAttr(p.id)}'
                  )"
                >
                  Beli Sekarang
                </button>

              </div>

            `

            : `

              <div class="detail-actions">

                <button
                  class="btn btn-primary"
                  disabled
                >
                  Stok habis
                </button>

              </div>

            `
        }

      </div>

    </div>

  `;

}


/* ================================================================
   BUY NOW
   ================================================================ */

async function buyNow(productId){

  const added =
    await addToCart(
      productId,
      detailQty
    );


  if(added){

    showPage(
      'cart'
    );

  }

}


/* ================================================================
   ORDERS
   ================================================================ */

function renderOrders(){

  const wrap =
    document.getElementById(
      'orders-content'
    );


  if(!wrap){

    return;
  }


  if(orders.length === 0){

    wrap.innerHTML = `

      <div class="empty-state">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >

          <path
            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          />

          <rect
            x="9"
            y="3"
            width="6"
            height="4"
            rx="1"
          />

        </svg>


        <p class="title">

          Belum ada pesanan

        </p>


        <p>

          Riwayat pesananmu akan muncul
          di sini setelah checkout.

        </p>

      </div>

    `;


    return;
  }


  wrap.innerHTML =
    orders.map(
      order => `

        <div class="order-card">

          <div class="order-head">

            <div>

              <div class="order-id">

                ${escapeHtml(order.id)}

              </div>


              <div class="order-time">

                ${fmtDate(order.time)}

              </div>

            </div>


            <span class="order-status">

              ${escapeHtml(order.status)}

            </span>

          </div>


          ${
            order.items
              .map(
                item => `

                  <div class="order-line">

                    <span>

                      ${escapeHtml(
                        item.name
                      )}

                      <span class="muted">

                        × ${item.qty}

                      </span>

                    </span>


                    <span>

                      ${fmtPrice(
                        item.price *
                        item.qty
                      )}

                    </span>

                  </div>

                `
              )
              .join('')
          }


          <div class="order-total">

            Total


            <span class="amt">

              ${fmtPrice(
                order.total
              )}

            </span>

          </div>

        </div>

      `
    ).join('');

}