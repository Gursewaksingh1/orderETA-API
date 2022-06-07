const Boxes = require("../model/boxesModel");
const Orders = require("../model/ordersModel");


exports.searchOrder = async (req, res) => {
    try {
        const id = req.query.id
        //fetching orders according to id
        if (id == undefined || null) {
            res.status(400).send({ status: "failed", error: "please send valid order id" })
        }
        let order = await Orders.find({ _id: id }).populate("boxes")

        res.status(201).send({ status: "success", order: order });
    } catch (err) {
        res.status(400).send({ status: "failed", error: err })
    }
}

