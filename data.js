/* ================================================================
   PETALIA - SHARED DATA & STORAGE
   ================================================================ */
(function(){
  const CATEGORIES = [
    'Aksesoris',
    'Tas & Dompet',
    'Fashion',
    'Perawatan Diri',
    'Dekorasi',
    'Alat Tulis'
  ];

  function daysAgo(n){
    return new Date(
      Date.now() - n * 24 * 60 * 60 * 1000
    ).toISOString();
  }

  const DEFAULT_PRODUCTS = [
    {
      id:'p1',
      name:'Dompet Mini Pita Pink',
      category:'Aksesoris',
      price:89000,
      stock:12,
      sold:340,
      image:'',
      desc:'Dompet mini dengan detail pita satin, muat kartu dan uang koin. Bahan kulit sintetis lembut, cocok dibawa ke mana saja.',
      addedAt:daysAgo(2)
    },
    {
      id:'p2',
      name:'Tas Selempang Beludru Rose',
      category:'Tas & Dompet',
      price:159000,
      stock:4,
      sold:210,
      image:'',
      desc:'Tas selempang berbahan beludru dengan warna rose yang elegan, tali rantai emas, pas untuk acara santai maupun semi-formal.',
      addedAt:daysAgo(10)
    },
    {
      id:'p3',
      name:'Kalung Bunga Sakura',
      category:'Aksesoris',
      price:65000,
      stock:25,
      sold:512,
      image:'',
      desc:'Kalung dengan liontin bunga sakura mungil, cocok dipakai sehari-hari atau dihadiahkan untuk orang tersayang.',
      addedAt:daysAgo(6)
    },
    {
      id:'p4',
      name:'Scrunchie Set Pita Satin (5pcs)',
      category:'Aksesoris',
      price:45000,
      stock:40,
      sold:890,
      image:'',
      desc:'Satu set 5 scrunchie satin dengan warna-warna pink pastel, lembut di rambut dan tidak mudah kusut.',
      addedAt:daysAgo(1)
    },
    {
      id:'p5',
      name:'Cardigan Rajut Blossom',
      category:'Fashion',
      price:199000,
      stock:8,
      sold:156,
      image:'',
      desc:'Cardigan rajut ringan dengan motif bunga kecil, nyaman dipakai untuk cuaca sejuk maupun ber-AC.',
      addedAt:daysAgo(14)
    },
    {
      id:'p6',
      name:'Lip Tint Petal Glow',
      category:'Perawatan Diri',
      price:79000,
      stock:3,
      sold:430,
      image:'',
      desc:'Lip tint dengan hasil akhir dewy, tahan lama, dan memberi warna pink alami di bibir.',
      addedAt:daysAgo(4)
    },
    {
      id:'p7',
      name:'Buku Catatan Bunga Vintage',
      category:'Alat Tulis',
      price:35000,
      stock:60,
      sold:275,
      image:'',
      desc:'Buku catatan bersampul motif bunga vintage, isi 120 halaman bergaris lembut untuk mencatat apa saja.',
      addedAt:daysAgo(20)
    },
    {
      id:'p8',
      name:'Lampu Tidur Bentuk Bunga',
      category:'Dekorasi',
      price:129000,
      stock:15,
      sold:98,
      image:'',
      desc:'Lampu tidur berbentuk kuncup bunga dengan cahaya hangat, mempercantik sudut kamar sekaligus menemani tidurmu.',
      addedAt:daysAgo(8)
    },
    {
      id:'p9',
      name:'Gantungan Kunci Mutiara Pink',
      category:'Aksesoris',
      price:25000,
      stock:2,
      sold:610,
      image:'',
      desc:'Gantungan kunci dengan untaian mutiara pink, ringan dan cantik untuk mempercantik tas atau kunci rumah.',
      addedAt:daysAgo(3)
    },
    {
      id:'p10',
      name:'Sweater Oversize Cherry Blossom',
      category:'Fashion',
      price:219000,
      stock:6,
      sold:187,
      image:'',
      desc:'Sweater oversize dengan bordir bunga sakura di dada, bahan tebal dan hangat, cocok untuk gaya kasual.',
      addedAt:daysAgo(12)
    },
    {
      id:'p11',
      name:'Vas Bunga Keramik Mini',
      category:'Dekorasi',
      price:95000,
      stock:20,
      sold:64,
      image:'',
      desc:'Vas bunga keramik ukuran mini dengan glasir pink lembut, pas untuk bunga kering maupun bunga segar.',
      addedAt:daysAgo(25)
    },
    {
      id:'p12',
      name:'Set Pensil Warna Aesthetic',
      category:'Alat Tulis',
      price:55000,
      stock:30,
      sold:143,
      image:'',
      desc:'Set 12 pensil warna dengan casing pastel aesthetic, cocok untuk menggambar maupun jurnal harian.',
      addedAt:daysAgo(18)
    }
  ];

  /* ================================================================
     STORAGE
     ================================================================ */

  async function storageGet(key, shared){
    try{
      /*
       * Jika environment menyediakan window.storage,
       * gunakan storage tersebut.
       */
      if(
        window.storage &&
        typeof window.storage.get === 'function'
      ){
        const r = await window.storage.get(key, shared);

        return r
          ? JSON.parse(r.value)
          : null;
      }
    }catch(err){
      console.warn(
        'window.storage read failed, using fallback:',
        err
      );
    }

    /*
     * Fallback untuk menjalankan HTML biasa secara lokal.
     */
    try{
      const raw = localStorage.getItem(
        'petalia:' + key
      );

      return raw
        ? JSON.parse(raw)
        : null;

    }catch(err){
      console.error(
        'localStorage read failed:',
        err
      );

      return null;
    }
  }


  async function storageSet(key, value, shared){
    try{
      /*
       * Gunakan window.storage jika tersedia.
       */
      if(
        window.storage &&
        typeof window.storage.set === 'function'
      ){
        await window.storage.set(
          key,
          JSON.stringify(value),
          shared
        );

        return true;
      }

    }catch(err){
      console.warn(
        'window.storage write failed, using fallback:',
        err
      );
    }

    /*
     * Fallback ke localStorage.
     */
    try{
      localStorage.setItem(
        'petalia:' + key,
        JSON.stringify(value)
      );

      return true;

    }catch(err){
      console.error(
        'localStorage write failed:',
        err
      );

      return false;
    }
  }


  /* ================================================================
     PRODUCTS
     ================================================================ */

  async function getProducts(){

    let products = await storageGet(
      'petalia_products',
      true
    );

    /*
     * Kalau belum ada data produk,
     * gunakan produk default.
     */
    if(
      !Array.isArray(products) ||
      products.length === 0
    ){
      products = DEFAULT_PRODUCTS.map(
        p => ({...p})
      );

      await storageSet(
        'petalia_products',
        products,
        true
      );
    }

    return products;
  }


  async function saveProducts(products){
    return storageSet(
      'petalia_products',
      products,
      true
    );
  }


  /* ================================================================
     ORDERS
     ================================================================ */

  async function getOrders(){

    const orders = await storageGet(
      'petalia_orders',
      true
    );

    return Array.isArray(orders)
      ? orders
      : [];
  }


  async function saveOrders(orders){

    return storageSet(
      'petalia_orders',
      orders,
      true
    );
  }


  /* ================================================================
     CART
     ================================================================ */

  async function getCart(){

    const cart = await storageGet(
      'petalia_cart',
      false
    );

    return Array.isArray(cart)
      ? cart
      : [];
  }


  async function saveCart(cart){

    return storageSet(
      'petalia_cart',
      cart,
      false
    );
  }


  /* ================================================================
     EXPORT KE WINDOW
     ================================================================ */

  window.PetaliaStore = {

    CATEGORIES,

    DEFAULT_PRODUCTS,

    storageGet,

    storageSet,

    getProducts,

    saveProducts,

    getOrders,

    saveOrders,

    getCart,

    saveCart

  };

})();