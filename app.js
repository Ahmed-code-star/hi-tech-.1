let cart=[];

function initFirebase(){
  const firebaseConfig = {
    apiKey: "AIzaSyC7bzqvjcPJr1KuNCQHARzViSzBjC2d36U",
    authDomain: "hi-tech-6becf.firebaseapp.com",
    projectId: "hi-tech-6becf",
    storageBucket: "hi-tech-6becf.appspot.com",
    messagingSenderId: "950613396329",
    appId: "1:950613396329:web:af749c15fdcef3805bcbf8",
    measurementId: "G-QS40KV8TVD"
  };
  firebase.initializeApp(firebaseConfig);
  window.db=firebase.firestore();
  window.auth=firebase.auth();
  window.storage=firebase.storage();
}

/* ---- العملاء ---- */
async function loadCategories(){
  const snap=await db.collection('categories').get();
  const c=document.getElementById('categoryList');
  if(!c) return;
  c.innerHTML='';
  snap.forEach(doc=>{
    const cat=doc.data();
    const d=document.createElement('div');
    d.innerHTML=`<h4>${cat.name_ar}</h4>`;
    c.appendChild(d);
  });
}

async function loadProducts(){
  const snap=await db.collection('products').get();
  const c=document.getElementById('productList');
  if(!c) return;
  c.innerHTML='';
  snap.forEach(doc=>{
    const p=doc.data();
    const d=document.createElement('div'); d.className='product';
    d.innerHTML=`<h3>${p.name_ar}</h3><p>${p.price} ج.م</p><button>اطلب</button>`;
    d.querySelector('button').onclick=()=>{
      cart=[{...p,qty:1}];
      document.getElementById('orderForm').style.display='block';
    };
    c.appendChild(d);
  });
}

async function createOrder(orderPayload,file){
  const ref=db.collection('orders').doc();
  const id=ref.id;
  let proof=null;
  if(file){
    const ext=file.name.split('.').pop();
    const sref=storage.ref().child(`payment_screens/${id}.${ext}`);
    await sref.put(file);
    const url=await sref.getDownloadURL();
    proof={url};
  }
  const doc={
    id,
    created_at:firebase.firestore.FieldValue.serverTimestamp(),
    customer:{name:orderPayload.name,phone:orderPayload.phone,address:orderPayload.address},
    items:orderPayload.items,
    payment_method:orderPayload.paymentMethod,
    payment_proof:proof,
    total_amount:orderPayload.total,
    status:'Pending'
  };
  await ref.set(doc);
  return {success:true,id};
}

/* ---- الأدمن ---- */
async function adminLogin(email,password){
  const user=await auth.signInWithEmailAndPassword(email,password);
  return user.user;
}

function listenForOrders(cb){
  return db.collection('orders').orderBy('created_at','desc')
    .onSnapshot(snap=>cb(snap.docs.map(d=>d.data())));
}

async function adminAddCategory(name){
  const ref=db.collection('categories').doc();
  const id=ref.id;
  const doc={id,name_ar:name,created_at:firebase.firestore.FieldValue.serverTimestamp()};
  await ref.set(doc);
  return doc;
}

async function loadCategoriesAdmin(){
  const snap=await db.collection('categories').get();
  const c=document.getElementById('categoryAdminList');
  const select=document.getElementById('pCategory');
  if(c){ c.innerHTML=''; }
  if(select){ select.innerHTML=''; }
  snap.forEach(doc=>{
    const cat=doc.data();
    if(c){
      const d=document.createElement('div');
      d.className='category';
      d.innerHTML=`<h4>${cat.name_ar}</h4><button onclick="deleteCategory('${cat.id}')">حذف</button>`;
      c.appendChild(d);
    }
    if(select){
      const opt=document.createElement('option');
      opt.value=cat.id; opt.textContent=cat.name_ar;
      select.appendChild(opt);
    }
  });
}

async function deleteCategory(id){
  await db.collection('categories').doc(id).delete();
  loadCategoriesAdmin();
}

async function adminAddProduct(productObj,files){
  const ref=db.collection('products').doc();
  const id=ref.id;
  let images=[];
  if(files && files.length){
    for(const f of files){
      const ext=f.name.split('.').pop();
      const sref=storage.ref().child(`product_images/${id}.${ext}`);
      await sref.put(f);
      const url=await sref.getDownloadURL();
      images.push({url});
    }
  }
  const doc={id,...productObj,images,created_at:firebase.firestore.FieldValue.serverTimestamp()};
  await ref.set(doc);
  return doc;
}

async function loadProductsAdmin(){
  const snap=await db.collection('products').get();
  const c=document.getElementById('productAdminList');
  if(!c) return;
  c.innerHTML='';
  snap.forEach(doc=>{
    const p=doc.data();
    const d=document.createElement('div'); d.className='product';
    d.innerHTML=`<h4>${p.name_ar}</h4><p>${p.price} ج.م</p>`;
    c.appendChild(d);
  });
}
