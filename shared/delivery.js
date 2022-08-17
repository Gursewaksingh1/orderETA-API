
const start_delivery_manually_confirm = (orders,confirmedStatus,userId) => {
    orders.forEach(order => {
        order.boxes.forEach(box => {
            if(!confirmedStatus.includes(box.status.type)) {
                box.status.type = "MANUALLY_CONFIRMED";
                box.status.description = "Box manually confirmed.";
                box.status.driver_id = userId
            }
        })
    })
    return orders
}

const check_similar_address = () => {
    
}