/* ================================================================
   PETALIA - ADMIN APP
   ================================================================ */

const Store = window.PetaliaStore;
const CATEGORIES = Store.CATEGORIES;

let products = [];
let orders = [];
let editingProductId = null;


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


function productImg(p){

  if(
    p.image &&
    String(p.image).trim()
  ){
    return String(
      p.image
    ).trim();
  }


  return `https://placehold.co/100x100/FFE1EC/C43F63?text=${encodeURIComponent(
    String(p.name)
      .split(' ')
      .slice(0,2)
      .join(' ')
  )}`;
}


function findProduct(id){

  return products.find(
    p => p.id === id
  );

}


/* ================================================================
   TOAST
   ================================================================ */

function showToast(
  msg,
  isError = false
){

  const t =
    document.getElementById(
      'toast'
    );


  if(!t){

    return;
  }


  t.innerHTML = `

    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      aria-hidden="true"
    >

      <path
        d="M20 6L9 17l-5-5"
      />

    </svg>


    <span>
      ${escapeHtml(msg)}
    </span>

  `;


  t.style.background =
    isError
      ? '#B03A4E'
      : 'var(--text)';


  t.classList.add(
    'show'
  );


  clearTimeout(
    window._toastTimer
  );


  window._toastTimer =
    setTimeout(
      () => {
        t.classList.remove(
          'show'
        );
      },
      2600
    );

}


/* ================================================================
   PETAL EFFECT
   ================================================================ */

function spawnPetals(){

  const field =
    document.getElementById(
      'petal-field'
    );


  if(!field){

    return;
  }


  const count =
    window.innerWidth < 700
      ? 8
      : 14;


  const colors = [
    '#F6A6C1',
    '#F8BBD0',
    '#F3C6D6',
    '#E85D82'
  ];


  let html = '';


  for(
    let i = 0;
    i < count;
    i++
  ){

    const left =
      Math.random() * 100;


    const size =
      10 +
      Math.random() * 14;


    const duration =
      11 +
      Math.random() * 10;


    const delay =
      Math.random() * -18;


    const drift =
      (
        Math.random() * 60 -
        30
      ).toFixed(0)
      + 'px';


    const color =
      colors[
        Math.floor(
          Math.random() *
          colors.length
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


  field.innerHTML =
    html;

}


/* ================================================================
   INIT ADMIN
   ================================================================ */

async function initAdmin(){

  spawnPetals();


  [
    products,
    orders
  ] = await Promise.all([

    Store.getProducts(),

    Store.getOrders()

  ]);


  fillCategorySelect();

  refreshAdmin();

}


window.addEventListener(
  'DOMContentLoaded',
  initAdmin
);


/* ================================================================
   CATEGORY SELECT
   ================================================================ */

function fillCategorySelect(){

  const select =
    document.getElementById(
      'f-category'
    );


  if(!select){

    return;
  }


  select.innerHTML =
    CATEGORIES
      .map(
        category => `

          <option
            value="${escapeAttr(category)}"
          >
            ${escapeHtml(category)}
          </option>

        `
      )
      .join('');

}


/* ================================================================
   STATISTICS
   ================================================================ */

function refreshStats(){

  const totalProducts =
    document.getElementById(
      'stat-products'
    );


  const totalStock =
    document.getElementById(
      'stat-stock'
    );


  const totalOrders =
    document.getElementById(
      'stat-orders'
    );


  if(totalProducts){

    totalProducts.textContent =
      products.length;

  }


  if(totalStock){

    totalStock.textContent =
      products.reduce(
        (
          sum,
          product
        ) =>
          sum +
          Number(
            product.stock || 0
          ),
        0
      );

  }


  if(totalOrders){

    totalOrders.textContent =
      orders.length;

  }

}


/* ================================================================
   REFRESH ADMIN
   ================================================================ */

function refreshAdmin(){

  refreshStats();

  renderAdminProducts();

  renderAdminOrders();

}


/* ================================================================
   ADMIN TABS
   ================================================================ */

function showAdminTab(tab){

  document
    .querySelectorAll(
      '.admin-tab'
    )
    .forEach(
      element =>
        element.classList.remove(
          'active'
        )
    );


  document
    .querySelectorAll(
      '.admin-panel'
    )
    .forEach(
      element =>
        element.classList.remove(
          'active'
        )
    );


  const tabButton =
    document.getElementById(
      'admintab-' + tab
    );


  const panel =
    document.getElementById(
      'adminpanel-' + tab
    );


  if(tabButton){

    tabButton.classList.add(
      'active'
    );

  }


  if(panel){

    panel.classList.add(
      'active'
    );

  }

}


/* ================================================================
   RENDER PRODUCTS
   ================================================================ */

function renderAdminProducts(){

  const rows =
    document.getElementById(
      'admin-product-rows'
    );


  if(!rows){

    return;
  }


  if(products.length === 0){

    rows.innerHTML = `

      <tr>

        <td colspan="7">

          Belum ada produk.

        </td>

      </tr>

    `;


    return;
  }


  rows.innerHTML =
    products
      .map(
        product => `

          <tr>

            <td>

              <img
                src="${escapeAttr(
                  productImg(product)
                )}"
                alt="${escapeAttr(
                  product.name
                )}"
              >

            </td>


            <td>

              ${escapeHtml(
                product.name
              )}

            </td>


            <td>

              ${escapeHtml(
                product.category
              )}

            </td>


            <td>

              ${fmtPrice(
                product.price
              )}

            </td>


            <td
              class="
                stock-badge
                ${
                  product.stock <= 5
                    ? 'low'
                    : ''
                }
              "
            >

              ${Number(
                product.stock || 0
              )}

            </td>


            <td>

              ${Number(
                product.sold || 0
              )}

            </td>


            <td>

              <div class="row-actions">

                <button
                  class="btn btn-ghost btn-sm"
                  onclick="editProduct(
                    '${escapeAttr(product.id)}'
                  )"
                >

                  Edit

                </button>


                <button
                  class="btn btn-danger btn-sm"
                  onclick="deleteProduct(
                    '${escapeAttr(product.id)}'
                  )"
                >

                  Hapus

                </button>

              </div>

            </td>

          </tr>

        `
      )
      .join('');

}


/* ================================================================
   EDIT PRODUCT
   ================================================================ */

function editProduct(id){

  const product =
    findProduct(id);


  if(!product){

    return;
  }


  editingProductId =
    id;


  document.getElementById(
    'f-name'
  ).value =
    product.name || '';


  document.getElementById(
    'f-category'
  ).value =
    product.category ||
    CATEGORIES[0];


  document.getElementById(
    'f-image'
  ).value =
    product.image || '';


  document.getElementById(
    'f-price'
  ).value =
    Number(
      product.price || 0
    );


  document.getElementById(
    'f-stock'
  ).value =
    Number(
      product.stock || 0
    );


  document.getElementById(
    'f-desc'
  ).value =
    product.desc || '';


  document.getElementById(
    'product-form-title'
  ).textContent =
    'Edit produk: ' +
    product.name;


  document.getElementById(
    'product-form-submit'
  ).textContent =
    'Simpan perubahan';


  document.getElementById(
    'product-form-cancel'
  ).style.display =
    'inline-flex';


  const form =
    document.querySelector(
      '.form-card'
    );


  if(form){

    form.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });

  }

}


/* ================================================================
   RESET FORM
   ================================================================ */

function resetProductForm(){

  editingProductId =
    null;


  document.getElementById(
    'f-name'
  ).value =
    '';


  document.getElementById(
    'f-category'
  ).value =
    CATEGORIES[0];


  document.getElementById(
    'f-image'
  ).value =
    '';


  document.getElementById(
    'f-price'
  ).value =
    '';


  document.getElementById(
    'f-stock'
  ).value =
    '';


  document.getElementById(
    'f-desc'
  ).value =
    '';


  document.getElementById(
    'product-form-title'
  ).textContent =
    'Tambah produk baru';


  document.getElementById(
    'product-form-submit'
  ).textContent =
    'Tambah produk';


  document.getElementById(
    'product-form-cancel'
  ).style.display =
    'none';

}


/* ================================================================
   ADD / UPDATE PRODUCT
   ================================================================ */

async function submitProductForm(){

  const name =
    document.getElementById(
      'f-name'
    ).value.trim();


  const category =
    document.getElementById(
      'f-category'
    ).value;


  const image =
    document.getElementById(
      'f-image'
    ).value.trim();


  const price =
    Number(
      document.getElementById(
        'f-price'
      ).value
    );


  const stock =
    Number(
      document.getElementById(
        'f-stock'
      ).value
    );


  const desc =
    document.getElementById(
      'f-desc'
    ).value.trim();


  /*
   * Validasi.
   */

  if(

    !name ||

    !Number.isFinite(
      price
    ) ||

    price < 0 ||

    !Number.isInteger(
      price
    ) ||

    !Number.isFinite(
      stock
    ) ||

    stock < 0 ||

    !Number.isInteger(
      stock
    )

  ){

    showToast(
      'Nama, harga, dan stok harus diisi dengan benar',
      true
    );


    return;
  }


  /*
   * Mode EDIT.
   */

  if(editingProductId){

    const product =
      findProduct(
        editingProductId
      );


    if(!product){

      return;
    }


    Object.assign(
      product,
      {

        name:name,

        category:category,

        image:image,

        price:price,

        stock:stock,

        desc:desc

      }
    );


    showToast(
      'Produk berhasil diperbarui'
    );


  }else{

    /*
     * Mode TAMBAH.
     */

    products.push({

      id:
        'p' +
        Date.now(),

      name:name,

      category:category,

      image:image,

      price:price,

      stock:stock,

      desc:desc,

      sold:0,

      addedAt:
        new Date()
          .toISOString()

    });


    showToast(
      'Produk baru ditambahkan'
    );

  }


  /*
   * Simpan ke storage.
   */

  const saved =
    await Store.saveProducts(
      products
    );


  if(!saved){

    products =
      await Store.getProducts();


    showToast(
      'Gagal menyimpan perubahan produk',
      true
    );


    refreshAdmin();


    return;
  }


  resetProductForm();

  refreshAdmin();

}


/* ================================================================
   DELETE PRODUCT
   ================================================================ */

async function deleteProduct(id){

  const product =
    findProduct(id);


  if(!product){

    return;
  }


  const confirmed =
    confirm(
      `Hapus "${product.name}" dari toko?`
    );


  if(!confirmed){

    return;
  }


  /*
   * Hapus produk.
   */

  products =
    products.filter(
      item =>
        item.id !== id
    );


  /*
   * Bersihkan produk tersebut
   * dari keranjang pembeli.
   */

  const cart =
    await Store.getCart();


  const newCart =
    cart.filter(
      item =>
        item.productId !== id
    );


  const productsSaved =
    await Store.saveProducts(
      products
    );


  const cartSaved =
    await Store.saveCart(
      newCart
    );


  if(
    !productsSaved ||
    !cartSaved
  ){

    products =
      await Store.getProducts();


    showToast(
      'Perubahan tidak tersimpan. Coba lagi.',
      true
    );


    refreshAdmin();


    return;
  }


  if(
    editingProductId === id
  ){

    resetProductForm();

  }


  refreshAdmin();


  showToast(
    'Produk berhasil dihapus'
  );

}


/* ================================================================
   RENDER ORDERS
   ================================================================ */

function renderAdminOrders(){

  const wrap =
    document.getElementById(
      'admin-orders-content'
    );


  if(!wrap){

    return;
  }


  if(orders.length === 0){

    wrap.innerHTML = `

      <div class="empty-state">

        <p class="title">

          Belum ada pesanan masuk

        </p>

      </div>

    `;


    return;
  }


  wrap.innerHTML =
    orders
      .map(
        order => `

          <div class="order-card">

            <div class="order-head">

              <div>

                <div class="order-id">

                  ${escapeHtml(
                    order.id
                  )}

                </div>


                <div class="order-time">

                  ${fmtDate(
                    order.time
                  )}

                </div>

              </div>


              <span class="order-status">

                ${escapeHtml(
                  order.status
                )}

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
      )
      .join('');

}


/* ================================================================
   BACKUP DATA
   ================================================================ */

function backupData(){

  /*
   * Data yang dimasukkan ke file backup.
   */

  const payload = {

    backupVersion:2,

    exportedAt:
      new Date()
        .toISOString(),

    products:products,

    orders:orders

  };


  /*
   * Buat file JSON.
   */

  const blob =
    new Blob(

      [
        JSON.stringify(
          payload,
          null,
          2
        )
      ],

      {
        type:'application/json'
      }

    );


  /*
   * Buat link download.
   */

  const url =
    URL.createObjectURL(
      blob
    );


  const a =
    document.createElement(
      'a'
    );


  a.href =
    url;


  a.download =
    `petalia-backup-${
      new Date()
        .toISOString()
        .slice(0,10)
    }.json`;


  document.body.appendChild(
    a
  );


  a.click();


  a.remove();


  URL.revokeObjectURL(
    url
  );


  showToast(
    'Backup data berhasil diunduh'
  );

}


/* ================================================================
   RESTORE DATA
   ================================================================ */

async function restoreData(
  event
){

  const file =
    event.target.files?.[0];


  if(!file){

    return;
  }


  try{

    /*
     * Baca file.
     */

    const text =
      await file.text();


    /*
     * Parse JSON.
     */

    const data =
      JSON.parse(
        text
      );


    /*
     * Validasi format.
     */

    if(

      !Array.isArray(
        data.products
      ) ||

      !Array.isArray(
        data.orders
      )

    ){

      throw new Error(
        'Format backup tidak sesuai'
      );

    }


    /*
     * Konfirmasi restore.
     */

    const confirmed =
      confirm(
        'Restore akan mengganti data produk dan pesanan saat ini. Lanjutkan?'
      );


    if(!confirmed){

      event.target.value =
        '';


      return;
    }


    /*
     * Simpan produk hasil restore.
     */

    const productsSaved =
      await Store.saveProducts(
        data.products
      );


    /*
     * Simpan pesanan hasil restore.
     */

    const ordersSaved =
      await Store.saveOrders(
        data.orders
      );


    if(
      !productsSaved ||
      !ordersSaved
    ){

      throw new Error(
        'Gagal menyimpan hasil restore'
      );

    }


    /*
     * Update data di halaman.
     */

    products =
      data.products;


    orders =
      data.orders;


    refreshAdmin();

    resetProductForm();


    showToast(
      'Data berhasil dipulihkan dari backup'
    );


  }catch(error){

    console.error(
      error
    );


    showToast(
      'Gagal membaca atau menyimpan file backup',
      true
    );


  }finally{

    /*
     * Reset input file supaya
     * file yang sama bisa dipilih
     * kembali.
     */

    event.target.value =
      '';

  }

}