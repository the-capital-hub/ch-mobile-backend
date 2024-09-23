import mongoose, { Schema, model } from "mongoose";
// import validator from "validator";
import { hashPassword } from "../utils/passwordManager.js";

const collectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Posts",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      // required: [true, "User must have a first name."],
      // minlength: [3, "First Name must not be shorter than 3 characters"],
      // maxlength: [10, "First Name must not be longer than 10 characters"],
      // validate: { validator: validator.isAlpha, message: "Invalid First Name" },
      trim: true,
    },
    lastName: {
      type: String,
      // required: [true, "User must have a last name."],
      // minlength: [3, "Last Name must not be shorter than 3 characters"],
      // maxlength: [10, "Last Name must not be longer than 10 characters"],
      // validate: { validator: validator.isAlpha, message: "Invalid Last Name" },
      trim: true,
    },
    linkedin:{type:String},
    userName:{type:String},
    phoneNumber: {
      type: String,
      // unique: true,
      // required: [true, "Chief Warden must have an contact number."],
      // validate: {
      //   validator: (number) => number.toString().length === 13,
      //   message: "Invalid phone number",
      // },
    },
    email: {
      type: String,
      trim: true,
      // unique: true,
      lowercase: true,
      // required: [true, "User must have an email."],
      // validate: {
      //   validator: function (email) {
      //     return /[a-z0-9]+@[a-z0-9]+.com/i.test(email);
      //   },
      //   message: "Invalid e-Mail",
      // },
    },
    password: {
      type: String,
      // required: [true, "User must have a password."],
    },
    experience: String,
    // experience: [
    //   {
    //     type: String,
    //   },
    // ],
    bio: {
      type: String,
      trim: true,
    },
    education: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      // required: [true, "User must provide location"],
    },
    gender: {
      type: String,
      // required: [true, "User must provide gender"],
    },
    startUp: {
      type: Schema.Types.ObjectId,
      ref: "StartUps",
    },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/drjt9guif/image/upload/v1723448166/TheCapitalHub/startUps/logos/viprylq9wb7e4qx6u8dt.webp",
    },

    designation:{type: String},
    savedPosts: [collectionSchema],
    connections: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    connectionsSent: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    connectionsReceived: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    recentExperience: [
      {
        logo: String,
        companyName: String,
        location: String,
        experienceDuration: String,
        role: String,
      },
    ],
    recentEducation: [
      {
        logo: String,
        schoolName: String,
        location: String,
        passoutYear: Number,
        course: String,
      },
    ],
    investor: {
      type: Schema.Types.ObjectId,
      ref: "Investors",
    },
    pinnedChat: [
      {
        type: Schema.Types.ObjectId,
        ref: "Chats",
      },
    ],
    featuredPosts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Posts",
      },
    ],
    companyUpdate:[{
      type: Schema.Types.ObjectId,
      ref: "Posts",
    },],
    userStatus: {
      type: String,
      default: "active"
    },
    blockedUsers: [
      { type: Schema.Types.ObjectId,
         ref: 'Users' },
     ],
    oneLinkId: {
      type: String,
      default: generateRandomNumber,
      unique: true,
      required: true,
    },
    isInvestor: {
      type: String,
      default: false,
    },
    secretKey: {
      type: String,
    },
    achievements: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
      },
    ],
    industry:{
      type:String
    },
    //startup user
    yearsOfExperience: {
      type: String,
    },
    previousExits: {
      type: String,
    },
    diversityMetrics: [
      {
        type: String,
      },
    ],
    //investor user
    sectorPreferences: [
      {
        type: String,
      },
    ],
    philosophy: {
      importanceOfManagement: String,
      roleAsAInvestor: String,
      founderAlmaMaterMatters: String,
      riskManagementInInvestments: String,
      guideOnSellingInvestments: String,
      timingInInvestmentDecisions: String,
      macroeconomicFactorsInfluenceInvestments: String,
      assessCompanyCompetitiveAdvantage: String,
      industryTrendsHoldInYourStrategy: String,
      evaluateCompanyGrowthPotential: String,
      weightGaveToTechnologicalInnovation: String,
    },
    investmentPhilosophy:{type:String},
    // philosophy: {
    //   whoareYou: String,
    //   yourBuildBefore: String,
    //   whyDoingThis: String,
    //   problem: String,
    //   solution: String,
    //   targetMarket: String,
    //   mvpProductYet: String,
    //   gainedAnyTraction: String,
    //   yourNextStep: String,
    //   useTheFundingRaised: String,
    // },

    // importanceOfManagament: {
    //   type: String,
    // },
    // roleAsAInvestor: {
    //   type: String,
    // },
    // founderAlmaMaterMatters: {
    //   type: String,
    // },
    // riskManagementInInvestments: {
    //   type: String,
    // },
    // guideOnSellingInvestments: {
    //   type: String,
    // },
    // timingInInvestmentDecisions: {
    //   type: String,
    // },
    // macroeconomicFactorsInfluenceInvestments: {
    //   type: String,
    // },
    // assessCompanyCompetitiveAdvantage: {
    //   type: String,
    // },
    // industryTrendsHoldInYourStrategy: {
    //   type: String,
    // },
    // evaluateCompanyGrowthPotential: {
    //   type: String,
    // },
    // weightGaveToTechnologicalInnovation: {
    //   type: String,
    // },
    investmentSize: {
      type: String,
    },
    investmentStage: {
      type: String,
    },
    fundingViaCapitalhubQuestions: {
      targetMarket: String,
      whyRightTimeForYourStartUp: String,
      competitiveAdvantage: String,
      biggestCompetitors: String,
      revenueGenerated: String,
    },
     subReferenceId:{
      type:String
    },
     subscriptionType:{
      type:String,
      enum:["Basic","Standard","Pro"],
      default: "Basic"
    },
     isSubscribed:{
      type:Boolean,
      default:false
    },
     trialStartDate: {
      type: Date
    },
    meetingToken:{
      type:Object
    },
  },
  {
    timestamps: true,
  }
);

// userSchema.pre("save", async function (next) {
//   try {
//     if (this.isModified && this.isModified("password")) {
//       this.password = await hashPassword(this.password);
//     }
//     next();
//   } catch (error) {
//     throw error;
//   }
// });

// userSchema.pre(
//   ["updateOne", "findByIdAndUpdate", "findOneAndUpdate"],
//   async function (next) {
//     try {
//       const data = this.getUpdate();
//       if (data?.password) {
//         data.password = hashPassword(this.password);
//       }
//       next();
//     } catch (error) {
//       throw error;
//     }
//   }
// );

function generateRandomNumber() {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return randomNumber.toString();
}

export const UserModel = model("Users", userSchema);
