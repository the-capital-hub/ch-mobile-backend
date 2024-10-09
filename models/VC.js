import { Schema, model } from "mongoose";

const VCSchema = new Schema(
    
{ 
    name:{
    type:String,
    required: true
},
logo:{
    type:String
},
    location:{
        type:String,
        required: true
    },
    facebook:{
        type:String
    },
    instagram:{
        type:String
    },
    linkedin:{
        type:String
    },
    twitter:{
        type:String
    },
    total_portfolio:{
        type:String
    },
    current_fund_corpus:{
        type:String
    },
    total_fund_corpus:{
        type:String
    },

    stage_focus:[{
        type:String
    }],
    sector_focus:[{
        type:String
    }],
    ticket_size:{
        type:String
    },
    age:{
        type:Number
    },
    admin:{
        type: Schema.Types.ObjectId,
        ref: "Users",
    },
    people:[{
        type: Schema.Types.ObjectId,
        ref: "Users",
    }],
    description:{
        type:String
    }
},


  {
    timestamps: true,
  }
);


export const VCModel = model("vcs", VCSchema);
