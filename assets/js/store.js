
(function(){
  const C = window.PRISMA_CONFIG;
  const P = window.PRISMA_PRODUCTS || [];
  const money = new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0});
  const root = document.body.dataset.root || '';
  const imgBase = root + 'assets/img/';
  const cartKey = 'prismaH2OCart';

  window.prismaMoney = v => money.format(v || 0);
  function getProduct(id){return P.find(p=>p.id===id)}
  function getCart(){try{return JSON.parse(localStorage.getItem(cartKey)||'[]')}catch(e){return []}}
  function saveCart(cart){localStorage.setItem(cartKey,JSON.stringify(cart));updateCartBadges();renderCart()}
  function countCart(){return getCart().reduce((a,b)=>a+b.qty,0)}
  function subtotal(){return getCart().reduce((a,b)=>a+(b.price*b.qty),0)}
  function add(id){
    const p=getProduct(id); if(!p)return;
    if(p.quoteOnly||p.price==null){openWhatsApp('Hola PRISMA H₂O, quiero cotizar '+p.name+' ('+p.sku+').');return}
    const cart=getCart(), item=cart.find(x=>x.id===id);
    if(item)item.qty++; else cart.push({id:p.id,name:p.name,sku:p.sku,price:p.price,qty:1,image:p.image});
    saveCart(cart); toast(p.name+' agregado al carrito');
  }
  function changeQty(id,delta){const cart=getCart();const i=cart.find(x=>x.id===id);if(!i)return;i.qty=Math.max(1,i.qty+delta);saveCart(cart)}
  function remove(id){saveCart(getCart().filter(x=>x.id!==id))}
  function updateCartBadges(){document.querySelectorAll('.cart-count').forEach(el=>el.textContent=countCart())}
  function openWhatsApp(text){window.open('https://wa.me/'+C.whatsapp+'?text='+encodeURIComponent(text),'_blank','noopener')}
  window.openPrismaWhatsApp=openWhatsApp;

  function imageMarkup(filename, cls='product-image'){
    return '<img src="'+imgBase+filename+'" class="'+cls+'" alt="" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="missing-image">Inserta <strong>'+filename+'</strong> en <code>assets/img/</code></div>'
  }
  function productCard(p){
    const price = p.quoteOnly || p.price == null
      ? '<div class="price">Bajo cotización</div>'
      : '<div class="price">'+money.format(p.price)+'</div>';

    const action = p.quoteOnly || p.price == null
      ? '<button type="button" class="btn btn-accent btn-sm" data-quote="'+p.id+'"><i class="bi bi-chat-dots"></i> Cotizar</button>'
      : '<button type="button" class="btn btn-prisma btn-sm" data-add="'+p.id+'"><i class="bi bi-cart-plus"></i> Agregar al carrito</button>';

    return '<div class="col-md-6 col-xl-4 product-item" data-category="'+p.category+'" data-search="'+(p.name+' '+p.family+' '+p.short).toLowerCase()+'">'
      + '<article class="product-card">'
      + '<div class="product-image-wrap">'+imageMarkup(p.image)+'</div>'
      + '<div class="product-body">'
      + '<div class="d-flex justify-content-between gap-2 align-items-center"><span class="product-badge">'+p.badge+'</span><span class="sku">'+p.sku+'</span></div>'
      + '<h3 class="product-title">'+p.name+'</h3>'
      + '<p class="product-copy">'+p.short+'</p>'
      + '<div class="product-actions">'
      + price
      + '<div class="d-flex flex-wrap gap-2 mt-3">'
      + '<button type="button" class="btn btn-soft btn-sm" data-details="'+p.id+'">Detalles</button>'
      + action
      + '</div>'
      + '</div>'
      + '</div>'
      + '</article>'
      + '</div>';
  }
  function renderProducts(){document.querySelectorAll('[data-product-set]').forEach(holder=>{let items=[...P];const set=holder.dataset.productSet;if(set!=='all')items=items.filter(p=>set.split(',').includes(p.category));holder.innerHTML=items.map(productCard).join('')})}

  function cartText(data={}){
    const cart=getCart();
    const lines=cart.map(i=>'• '+i.name+' × '+i.qty+' — '+money.format(i.price*i.qty));
    return ['Hola PRISMA H₂O, quiero finalizar este pedido:','',...lines,'','Subtotal: '+money.format(subtotal()),'Envío: por confirmar','', 'Nombre: '+(data.nombre||''),'Empresa / uso: '+(data.empresa||''),'Ciudad: '+(data.ciudad||''),'Teléfono: '+(data.telefono||''),'Correo: '+(data.correo||''),'Dirección: '+(data.direccion||''),'Observaciones: '+(data.mensaje||'')].join('\n')
  }

  function injectCommerce(){
    document.body.insertAdjacentHTML('beforeend', `
      <button class="btn btn-prisma cart-fab" type="button" data-bs-toggle="offcanvas" data-bs-target="#cartCanvas"><i class="bi bi-cart3"></i> <span class="cart-count badge text-bg-warning ms-1">0</span></button>
      <a class="whatsapp-fab" href="#" data-global-whatsapp aria-label="WhatsApp"><i class="bi bi-whatsapp"></i></a>
      <div class="offcanvas offcanvas-end" tabindex="-1" id="cartCanvas" aria-labelledby="cartTitle">
        <div class="offcanvas-header border-bottom"><div><div class="eyebrow"><i class="bi bi-cart3"></i> Compra</div><h2 class="h4 mb-0 mt-2" id="cartTitle">Tu carrito</h2></div><button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button></div>
        <div class="offcanvas-body d-flex flex-column"><div id="cartItems"></div><div class="mt-auto pt-3 border-top"><div class="d-flex justify-content-between align-items-center"><span class="fw-bold">Subtotal</span><span class="price" id="cartSubtotal">$0</span></div><p class="small text-secondary mt-2 mb-3">El valor de envío se confirma según ciudad y características del pedido.</p><div class="d-grid gap-2"><button class="btn btn-prisma" id="checkoutBtn"><i class="bi bi-credit-card"></i> Continuar compra</button><button class="btn btn-soft" id="cartWhatsApp"><i class="bi bi-whatsapp"></i> Enviar pedido por WhatsApp</button></div></div></div>
      </div>
      <div class="modal fade" id="productModal" tabindex="-1"><div class="modal-dialog modal-xl modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h2 class="modal-title h4" id="productModalTitle"></h2><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="productModalBody"></div></div></div></div>
      <div class="modal fade" id="checkoutModal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><div><div class="eyebrow"><i class="bi bi-lock"></i> Finalizar compra</div><h2 class="modal-title h4 mt-2">Datos del pedido</h2></div><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><form id="checkoutForm" class="needs-validation" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label">Nombre *</label><input class="form-control" name="nombre" required></div><div class="col-md-6"><label class="form-label">Empresa / uso</label><input class="form-control" name="empresa"></div><div class="col-md-6"><label class="form-label">Ciudad *</label><input class="form-control" name="ciudad" required></div><div class="col-md-6"><label class="form-label">Teléfono *</label><input class="form-control" name="telefono" required></div><div class="col-md-6"><label class="form-label">Correo *</label><input class="form-control" type="email" name="correo" required></div><div class="col-md-6"><label class="form-label">Dirección *</label><input class="form-control" name="direccion" required></div><div class="col-12"><label class="form-label">Observaciones</label><textarea class="form-control" name="mensaje" rows="3"></textarea></div></div><hr class="my-4"><h3 class="h5">Forma de pago</h3><div class="row g-3"><div class="col-md-4"><div class="payment-box"><strong>Pago en línea</strong><div class="small text-secondary">Wompi / Mercado Pago / PayU</div></div></div><div class="col-md-8"><div class="alert alert-prisma mb-0"><strong>Integración preparada.</strong> Para activar una pasarela real debes ingresar el enlace o credenciales del comercio en <code>assets/js/config.js</code>. Mientras tanto, el pedido puede cerrarse de forma asistida por WhatsApp.</div></div></div><div class="d-flex flex-wrap gap-2 mt-4"><button type="submit" class="btn btn-support"><i class="bi bi-whatsapp"></i> Finalizar por WhatsApp</button><button type="button" class="btn btn-prisma" id="payOnlineBtn"><i class="bi bi-credit-card-2-front"></i> Pagar en línea</button></div></form></div></div></div></div>
      <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index:1100"><div class="toast" id="prismaToast"><div class="toast-body"></div></div></div>`)
  }

  function renderCart(){const holder=document.getElementById('cartItems');if(!holder)return;const cart=getCart();if(!cart.length){holder.innerHTML='<div class="cart-empty"><i class="bi bi-cart-x fs-1"></i><h3 class="h5 mt-3">Tu carrito está vacío</h3><p class="small">Agrega equipos o insumos desde las páginas de productos.</p></div>'}else{holder.innerHTML=cart.map(i=>'<div class="cart-row"><img class="cart-thumb" src="'+imgBase+i.image+'" alt=""><div><strong>'+i.name+'</strong><div class="small text-secondary">'+money.format(i.price)+'</div><div class="cart-qty mt-2"><button data-dec="'+i.id+'">−</button><span>'+i.qty+'</span><button data-inc="'+i.id+'">+</button></div></div><button class="btn btn-sm btn-outline-danger" data-remove="'+i.id+'"><i class="bi bi-trash"></i></button></div>').join('')}document.getElementById('cartSubtotal').textContent=money.format(subtotal());updateCartBadges()}

  function openDetails(id){const p=getProduct(id);if(!p)return;document.getElementById('productModalTitle').textContent=p.name;const specs=(p.details||[]).map(x=>'<span class="spec-chip">'+x+'</span>').join('');const gallery=(p.gallery||[p.image]).map(f=>'<div>'+imageMarkup(f,'product-context-img')+'</div>').join('');const price=p.quoteOnly||p.price==null?'<div class="price">Precio bajo cotización</div>':'<div class="price">'+money.format(p.price)+'</div>';const action=p.quoteOnly||p.price==null?'<button class="btn btn-accent" data-quote="'+p.id+'">Solicitar cotización</button>':'<button class="btn btn-prisma" data-add="'+p.id+'">Agregar al carrito</button>';document.getElementById('productModalBody').innerHTML='<div class="row g-4"><div class="col-lg-6"><div class="detail-gallery">'+gallery+'</div></div><div class="col-lg-6"><span class="product-badge">'+p.family+'</span><p class="lead mt-3">'+p.short+'</p><div class="mb-3">'+specs+'</div>'+price+'<div class="d-flex gap-2 mt-4">'+action+'<button class="btn btn-soft" data-quote="'+p.id+'">Hablar con asesor</button></div></div></div>';bootstrap.Modal.getOrCreateInstance(document.getElementById('productModal')).show()}

  function toast(msg){const t=document.getElementById('prismaToast');t.querySelector('.toast-body').textContent=msg;bootstrap.Toast.getOrCreateInstance(t,{delay:2200}).show()}

  function bind(){
    document.addEventListener('click',e=>{
      const addBtn=e.target.closest('[data-add]');if(addBtn){e.preventDefault();add(addBtn.dataset.add)}
      const quote=e.target.closest('[data-quote]');if(quote){e.preventDefault();const p=getProduct(quote.dataset.quote);if(p)openWhatsApp('Hola PRISMA H₂O, quiero información y cotización de '+p.name+' ('+p.sku+').')}
      const det=e.target.closest('[data-details]');if(det){e.preventDefault();openDetails(det.dataset.details)}
      const inc=e.target.closest('[data-inc]');if(inc)changeQty(inc.dataset.inc,1)
      const dec=e.target.closest('[data-dec]');if(dec)changeQty(dec.dataset.dec,-1)
      const rem=e.target.closest('[data-remove]');if(rem)remove(rem.dataset.remove)
      const gw=e.target.closest('[data-global-whatsapp]');if(gw){e.preventDefault();openWhatsApp('Hola PRISMA H₂O, quiero información sobre sus soluciones para análisis de agua.')}
    })
    document.getElementById('cartWhatsApp')?.addEventListener('click',()=>openWhatsApp(cartText()))
    document.getElementById('checkoutBtn')?.addEventListener('click',()=>{if(!getCart().length){toast('Agrega productos antes de continuar.');return}bootstrap.Offcanvas.getOrCreateInstance(document.getElementById('cartCanvas')).hide();bootstrap.Modal.getOrCreateInstance(document.getElementById('checkoutModal')).show()})
    document.getElementById('checkoutForm')?.addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget;f.classList.add('was-validated');if(!f.checkValidity())return;const data=Object.fromEntries(new FormData(f).entries());openWhatsApp(cartText(data))})
    document.getElementById('payOnlineBtn')?.addEventListener('click',()=>{const url=C.payment.wompiCheckoutUrl||C.payment.mercadopagoCheckoutUrl||C.payment.payuCheckoutUrl;if(url)window.open(url,'_blank','noopener');else toast('La pasarela está preparada pero aún no tiene credenciales/enlace configurado.')})
  }

  function bindFilters(){const input=document.getElementById('productSearch');const btns=document.querySelectorAll('[data-filter]');function apply(){const term=(input?.value||'').toLowerCase().trim();const active=document.querySelector('[data-filter].active')?.dataset.filter||'all';document.querySelectorAll('.product-item').forEach(el=>{const okCat=active==='all'||el.dataset.category===active;const okTerm=!term||el.dataset.search.includes(term);el.style.display=okCat&&okTerm?'':'none'})}input?.addEventListener('input',apply);btns.forEach(b=>b.addEventListener('click',()=>{btns.forEach(x=>x.classList.remove('active'));b.classList.add('active');apply()}))}

  document.addEventListener('DOMContentLoaded',()=>{injectCommerce();renderProducts();renderCart();bind();bindFilters();document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear())})
})();
