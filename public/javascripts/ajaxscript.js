function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cartCount').html()
                count = parseInt(count) + 1
                $('#cartCount').html(count)
            }
            swal({
                title: "Good job!",
                text: "Product Added to Cart",
                icon: "success",
              });
              
        }
    })
}
function changeQuantity(cartId, proId,userId, count) {
    let quantity = parseInt(document.getElementById(proId).innerHTML)
    count = parseInt(count)
    $.ajax({
        url: '/change-product-quantity',
        data: {
            user:userId,
            cart: cartId,
            product: proId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success:(response) => {
            console.log(response);
            if (response.removeProduct) {
               alert("Product Removed from Cart")
                location.reload()
            } else {
                document.getElementById(proId).innerHTML=quantity+count
                document.getElementById('total').innerHTML=response.total
                // document.getElementById('total').innerHTML=response.cartData.subTotal.serialize()
                
                location.reload()
                
                
            }
            
        }
    })
}

$("#pass-change-form").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/change-password',
        method:'post',
        data: $('#pass-change-form').serialize(),
        success:(response)=>{
            if(response.status){  
               swal("Password Changed Successfully").then(()=>{
                location.reload()
               }
               )
               
            }
        }      
    })

})

function cancelOrder(orderId) {
    alert('ffgdfgdfgd')
    $.ajax({
        url: '/cancel-order/' + orderId,
        method: 'post',
        success: (response) => {
            alert('Order ancelled')
            location.reload()
            
        }
    })
}


$("#edit-profile-form").submit((e)=>{
    console.log('hdusgdsg');
    e.preventDefault()
    $.ajax({
        url:'/edit-profile',
        method:'post',
        data: $('#edit-profile-form').serialize(),
        success:(response)=>{
            if(response.status){
                alert('Profile Edited Successfully')
                location.reload()
                
            }
        }
        
    })

})


function deleteAddress(addressId,userId) {
    alert('ffgdfgdfgdfgfg')
    $.ajax({
        url: '/delete-address/' + addressId,
        method: 'post',
        data:{
            userId:userId,
            addressId:addressId
        },
        success: (response) => {
            alert('Address Deleted')
            location.reload()
            
        }
    })
}





