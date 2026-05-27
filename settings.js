const STORE_CONFIG = {
  name: 'KELVIN STORE',
  logo: 'KELVIN',
  dataPath: '../database/',
  currency: 'IDR',
  currencySymbol: 'Rp',
  cartKey: 'kelvinstore_cart',
  themeKey: 'kelvinstore_theme',
  dashboardKey: 'kelvinstore_dashboard',
  itemsPerPage: 12,
  featuredCount: 8,
  heroInterval: 4000,
  whatsapp: '6285741137312',
  whatsappLink: 'https://wa.me/6285741137312',
  tiktok: 'https://tiktok.com/@kelvinstorexd',
  youtube: 'https://youtube.com/@kelvin_offc',
  formatOrderMessage: function(items, total) {
    let msg = 'Halo KELVIN STORE! Saya ingin order:%0A';
    items.forEach((item, i) => {
      msg += `${i+1}. ${item.name} (${item.size||'-'}, ${item.color||'-'}) x${item.qty} = Rp ${(item.price * item.qty).toLocaleString('id-ID')}%0A`;
    });
    msg += `%0ATotal: Rp ${total}%0A%0ANama: ?%0AAlamat: ?%0AEkspedisi: ?`;
    return msg;
  }
};
