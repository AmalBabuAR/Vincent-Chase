function addToCart(proId){
    // Swal.fire({
    //     title: 'Do you want to delete this product?',
    //     text: "You won't be able to revert this!",
    //     icon: 'warning',
    //     showCancelButton: true,
    //     confirmButtonColor: '#3085d6',
    //     cancelButtonColor: '#d33',
    //     confirmButtonText: 'Yes, delete it!'
    //   }).then((result) => {
    //     if (result.isConfirmed) {

        $.ajax({
            url:'/add-to-cart/'+proId,
            method:'get',
            success:(response)=>{
                if(response.status){
                    Swal.fire({
                        position: 'center',
                        icon: 'success',
                        title: 'Added to Cart',
                        showConfirmButton: false,
                        timer: 1500
                      })
                    let count =$('#cart-count').html()
                    count = parseInt(count)+1
                    $('#cart-count').html(count)
                    location.href=self.attr("href")
                }   
            }
        })
            
    //     }
    //   })
}
