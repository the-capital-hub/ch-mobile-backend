import { VCModel } from "../models/VC.js";
import { getVc } from "../services/vcService.js";

 export const getVcController = async(req,res)=>{
    try{
        const {vcId} = req.body;
        const response = await getVc(vcId);
        res.status(200).send({status: true, message:"VC details fetched ", data:response});
    }
    catch(error){
console.log(error);
res.status(500).send(error);
    }
 }