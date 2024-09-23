import axios from "axios";
import { UserModel } from "../models/User.js";
import { Cashfree } from "cashfree-pg";
import crypto from "crypto";
import { response } from "express";

Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;
const generateSubscriptionId = () => {
  const timestamp = Date.now().toString(36); 
  const randomStr = crypto.randomBytes(4).toString("hex"); 

  return `sub_${timestamp}_${randomStr}`;
};

export const create_subscription = async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.userId });
    if (req.body.subscriptionType === "Basic") {
      if (user.trialStartDate) {
        return res.status(400).json({ message: "Trial already taken" });
      } else {
        const currentDate = new Date();
        await UserModel.findOneAndUpdate(
          { _id: req.userId },
          { trialStartDate: currentDate, subscriptionType: "Basic" }
        );
        return res.status(200).json({ message: "Trial started" });
      }
    } else {

    const subscriptionId = generateSubscriptionId();
    let request = {
      order_amount: 1,
      order_currency: "INR",
      order_id: subscriptionId,
      customer_details: {
        customer_id: user._id,
        customer_phone: user.phoneNumber,
        customer_name: `${user.firstName} ${user.lastName}`,
        customer_email: user.email,
      },
      order_meta: {
        return_url: `${process.env.BASE_URL}payment/success?order_id=${subscriptionId}`,
      },
    };
    Cashfree.PGCreateOrder("2023-08-01", request)
      .then(async (response) => {
        await UserModel.findOneAndUpdate(
          { _id: req.userId },
          {
            subReferenceId: response.data.order_id,
            subscriptionType: req.body.subscriptionType,
          }
        );
        return res.status(200).send(response.data);
      })
      .catch((error) => {
        console.log(error.response.data.message);
      });
     }
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};

export const update_plan_status = async (req, res) => {
  try {
    const userData = await UserModel.findOne({ _id: req.userId });
    const option = {
      method: "GET",
      url: `https://test.cashfree.com/api/v2/subscriptions/${userData.subReferenceId}`,
      headers: {
        "Content-Type": "application/json",
        "X-Client-Id": process.env.CASHFREE_TEST_CLIENT_ID,
        "X-Client-Secret": process.env.CASHFREE_TEST_SECRET_KEY,
      },
    };
    await axios
      .request(option)
      .then(async (response) => {
        console.log(response.data);
        if (response.data.status === "SUCCESS")
          await UserModel.findOneAndUpdate(
            { _id: req.userId },
            { isSubscribed: true }
          );
        return res.status(200).send(response.data);
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send(err);
      });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

export const get_subscription_plan = async (req, res) => {
  try {
    const order_id = req.body.orderId;
    Cashfree.PGOrderFetchPayments("2023-08-01", order_id)
      .then(async (response) => {
        if (response.data[0].payment_status === "SUCCESS") {
          await UserModel.findOneAndUpdate(
            { _id: req.userId },
            { isSubscribed: true }
          );
        }
        const user = await UserModel.findOne({_id:req.userId})
        console.log(response.data);
        return res.status(200).send({paymentData:response.data[0],user});
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send(err);
      });
  } catch (err) {
    console.log(err.message);
    return res.status(500).send(err.message);
  }
};
