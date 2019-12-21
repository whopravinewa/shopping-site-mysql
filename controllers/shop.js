const Product = require('../models/product')

exports.getProducts  = (req, res, next) => {
  Product.findAll().then((products)=>{
    res.render('shop/index', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
    })
  }).catch((err)=>{
    console.log(err)
  })
}

exports.getProduct = (req,res,next)=>{
  const prodId = req.params.id
  Product.findByPk(prodId).then((product)=>{
    const pageTitle = product.title
    res.render('shop/product-detail',{
      pageTitle,
      path : '/products',
      product
    })
  }).catch((err)=>{
    console.log(err)
  })
 }

exports.getIndex = (req,res,next) =>{
  Product.findAll().then((products)=>{
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
    })
  }).catch((err)=>{
    console.log(err)
  })
}

exports.getCart = (req,res,next)=>{
  req.user.getCart().then((cart)=>{
    return cart.getProducts().then((cartProducts)=>{
      res.render('shop/cart', {
        pageTitle: 'Your Cart',
        path: '/cart',
        prods : cartProducts
      })  
    })
  }).catch((err)=>{
    console.log(err)
  })
}

exports.postCart = (req,res,next)=>{
  const prodId = req.body.productId
  let fetchedCart
  let newQty = 1
  req.user.getCart().then((cart)=>{
    fetchedCart = cart
    return cart.getProducts({ where : {id:prodId}})
  }).then((products)=>{
    let product
    if(products.length > 0){
      product = products[0]
    }
    if(product){
      const oldQuantity = product.cartItem.quantity
      newQty = 1 + oldQuantity
      return product
    } 
    return Product.findByPk(prodId)
  }).then((product)=>{
    return fetchedCart.addProduct(product, { through : {quantity : newQty}})
  }).then(()=>{
    res.redirect('/cart')
  }).catch((err)=>{
    console.log(err)
  })
}

exports.postDeleteCartItem = (req,res,next) =>{
  const prodId = req.body.productId
  req.user.getCart().then((cart)=>{
    return cart.getProducts({where : { id: prodId }})
  }).then((products)=>{
    const product = products[0]
    return product.cartItem.destroy()
  }).then(()=>{
    res.redirect('/cart')

  }).catch()
}

exports.postOrder = (req, res, next) =>{
  let fetchedCart
  req.user.getCart().then((cart)=>{
    fetchedCart = cart
    return cart.getProducts()
  }).then((products)=>{
    return req.user.createOrder().then((order)=>{
      return order.addProducts(products.map((product)=>{
        product.orderItem = { quantity : product.cartItem.quantity }
        return product
      }))
    }).catch()
  }).then(()=>{
    return fetchedCart.setProducts(null)
  }).then(()=>{
    res.redirect('/orders')
  }).catch()
}

exports.getOrders = (req,res,next)=>{
  req.user.getOrders({ include : ['products']}).then((orders)=>{
    res.render('shop/orders', {
      pageTitle: 'Your Orders',
      path: '/orders',
      orders
    })  
  }).catch()
}
